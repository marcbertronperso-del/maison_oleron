"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { pricingPeriods } from "~/server/db/schema";
import { logAdminAction } from "~/lib/audit";

const UUID_RE =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

const PriceEurSchema = z
  .string()
  .regex(/^\d+$/, "Prix invalide.")
  .transform(Number)
  .pipe(z.number().int().min(1).max(100_000));

export async function updatePeriodPrice(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    redirect("/admin/tarifs?error=Identifiant+invalide.");
  }

  const parsed = PriceEurSchema.safeParse(formData.get("priceEur"));
  if (!parsed.success) {
    redirect(
      `/admin/tarifs?error=${encodeURIComponent("Prix invalide. Entrez un entier en euros (ex: 120).")}&updated=${id}`,
    );
  }

  const [before] = await db
    .select({ price: pricingPeriods.price_per_night })
    .from(pricingPeriods)
    .where(eq(pricingPeriods.id, id))
    .limit(1);

  await db
    .update(pricingPeriods)
    .set({ price_per_night: parsed.data * 100 })
    .where(eq(pricingPeriods.id, id));

  try {
    await logAdminAction({
      action: "UPDATE_PERIOD_PRICE",
      entityType: "pricing_period",
      entityId: id,
      details: {
        oldPriceCents: before?.price,
        newPriceCents: parsed.data * 100,
      },
    });
  } catch { /* audit failure must not block the main action */ }

  revalidatePath("/admin/tarifs");
  redirect(`/admin/tarifs?success=${encodeURIComponent("Tarif mis à jour.")}`);
}

const CreatePeriodSchema = z.object({
  name: z.string().min(1).max(255),
  startMonth: z.coerce.number().int().min(1).max(12),
  endMonth: z.coerce.number().int().min(1).max(12),
  priceEur: z.coerce.number().int().min(1).max(100_000),
});

export async function createPeriod(formData: FormData) {
  const parsed = CreatePeriodSchema.safeParse({
    name: formData.get("name"),
    startMonth: formData.get("startMonth"),
    endMonth: formData.get("endMonth"),
    priceEur: formData.get("priceEur"),
  });

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Données invalides.";
    redirect(`/admin/tarifs?error=${encodeURIComponent(msg)}`);
  }

  const { name, startMonth, endMonth, priceEur } = parsed.data;

  const [inserted] = await db
    .insert(pricingPeriods)
    .values({ name, start_month: startMonth, end_month: endMonth, price_per_night: priceEur * 100 })
    .returning({ id: pricingPeriods.id });

  try {
    await logAdminAction({
      action: "CREATE_PERIOD",
      entityType: "pricing_period",
      entityId: inserted?.id,
      details: { name, startMonth, endMonth, priceEur },
    });
  } catch { /* audit failure must not block the main action */ }

  revalidatePath("/admin/tarifs");
  redirect(`/admin/tarifs?success=${encodeURIComponent("Période ajoutée.")}`);
}
