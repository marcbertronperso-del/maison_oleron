import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { bookings, slotHolds } from "~/server/db/schema";
import { getPricePerNight, getDiscountRate } from "~/lib/booking-rules";
import { countNights } from "~/lib/pricing";
import { stripe } from "~/lib/stripe";

const InitiatePaymentSchema = z.object({
  slotHoldId: z.string().uuid(),
  tenantName: z.string().min(1).max(255),
  tenantEmail: z.string().email().max(255),
  tenantPhone: z.string().regex(/^\d{10}$/),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json() as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = InitiatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slotHoldId, tenantName, tenantEmail, tenantPhone } = parsed.data;

  const [hold] = await db
    .select()
    .from(slotHolds)
    .where(eq(slotHolds.id, slotHoldId))
    .limit(1);

  if (!hold || hold.expires_at <= new Date()) {
    return NextResponse.json(
      { error: "Slot hold expired", code: "HOLD_EXPIRED" },
      { status: 410 },
    );
  }

  const nights = countNights(hold.arrival_date, hold.departure_date);
  const pricePerNight = getPricePerNight(hold.arrival_date);
  const subtotal = nights * pricePerNight;
  const discountRate = getDiscountRate(hold.arrival_date, hold.departure_date);
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal - discountAmount;
  const totalCents = total * 100;
  const depositCents = Math.round(totalCents * 0.3);

  try {
    // Create pending booking record before PaymentIntent so metadata carries the bookingId
    const [booking] = await db
      .insert(bookings)
      .values({
        arrival_date: hold.arrival_date,
        departure_date: hold.departure_date,
        tenant_name: tenantName,
        tenant_email: tenantEmail,
        tenant_phone: tenantPhone,
        total_price: totalCents,
        deposit_amount: depositCents,
        status: "pending",
      })
      .returning({ id: bookings.id });

    if (!booking) throw new Error("bookings insert returned no rows");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositCents,
      currency: "eur",
      receipt_email: tenantEmail,
      metadata: {
        bookingId: booking.id,
        slotHoldId,
      },
      automatic_payment_methods: { enabled: true },
    });

    if (!paymentIntent.client_secret) throw new Error("No client_secret in PaymentIntent");

    return NextResponse.json(
      {
        data: {
          clientSecret: paymentIntent.client_secret,
          bookingId: booking.id,
          depositCents,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[initiate-payment] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
