import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { slotHolds } from "~/server/db/schema";
import { TunnelCoordonneesForm } from "~/components/booking/TunnelCoordonneesForm";

export default async function CoordonneesPage({
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

  return (
    <TunnelCoordonneesForm
      slotHoldId={slotHoldId}
      arrivalDate={hold.arrival_date}
      departureDate={hold.departure_date}
      expiresAt={hold.expires_at.toISOString()}
    />
  );
}
