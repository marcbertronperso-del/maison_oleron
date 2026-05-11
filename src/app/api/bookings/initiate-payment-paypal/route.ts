import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { bookings, slotHolds } from "~/server/db/schema";
import { getPricePerNight, getDiscountRate } from "~/lib/booking-rules";
import { countNights } from "~/lib/pricing";
import { capturePayPalOrder } from "~/lib/paypal";

const InitiatePaypalSchema = z.object({
  orderId: z.string().min(1),
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

  const parsed = InitiatePaypalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { orderId, slotHoldId, tenantName, tenantEmail, tenantPhone } =
    parsed.data;

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
    const { success, captureId } = await capturePayPalOrder(orderId);
    if (!success) {
      return NextResponse.json(
        { error: "PayPal capture failed", code: "PAYPAL_CAPTURE_FAILED" },
        { status: 402 },
      );
    }

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
        paypal_order_id: captureId,
      })
      .returning({ id: bookings.id });

    if (!booking) throw new Error("bookings insert returned no rows");

    return NextResponse.json(
      { data: { bookingId: booking.id } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[initiate-payment-paypal] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
