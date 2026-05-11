import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { slotHolds } from "~/server/db/schema";
import { getPricePerNight, getDiscountRate } from "~/lib/booking-rules";
import { countNights } from "~/lib/pricing";
import { createPayPalOrder } from "~/lib/paypal";

const CreateOrderSchema = z.object({
  slotHoldId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json() as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slotHoldId } = parsed.data;

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
    const orderId = await createPayPalOrder(depositCents);
    return NextResponse.json({ data: { orderId } }, { status: 201 });
  } catch (error) {
    console.error("[create-paypal-order] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
