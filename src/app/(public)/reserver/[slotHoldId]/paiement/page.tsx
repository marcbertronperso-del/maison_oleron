import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { slotHolds } from "~/server/db/schema";
import { getPricePerNight, getDiscountRate } from "~/lib/booking-rules";
import { countNights } from "~/lib/pricing";
import { env } from "~/env.js";
import { TunnelPaiementForm } from "~/components/booking/TunnelPaiementForm";

export default async function PaiementPage({
  params,
}: {
  params: Promise<{ slotHoldId: string }>;
}) {
  const { slotHoldId } = await params;

  const [hold] = await db
    .select()
    .from(slotHolds)
    .where(eq(slotHolds.id, slotHoldId))
    .limit(1);

  if (!hold || hold.expires_at <= new Date()) {
    redirect("/#disponibilites");
  }

  const nights = countNights(hold!.arrival_date, hold!.departure_date);
  const pricePerNight = getPricePerNight(hold!.arrival_date);
  const subtotal = nights * pricePerNight;
  const discountRate = getDiscountRate(hold!.arrival_date, hold!.departure_date);
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal - discountAmount;
  const totalCents = total * 100;
  const depositCents = Math.round(totalCents * 0.3);

  return (
    <TunnelPaiementForm
      slotHoldId={slotHoldId}
      arrivalDate={hold!.arrival_date}
      departureDate={hold!.departure_date}
      expiresAt={hold!.expires_at.toISOString()}
      depositCents={depositCents}
      paypalClientId={env.PAYPAL_CLIENT_ID}
    />
  );
}
