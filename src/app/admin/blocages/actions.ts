"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, gt, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { availabilityBlocks, bookings } from "~/server/db/schema";
import { logAdminAction } from "~/lib/audit";

const CreateBlockSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide."),
    reason: z.string().max(255).optional(),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: "La date de fin doit être égale ou postérieure à la date de début.",
  });

export async function createBlock(formData: FormData) {
  const parsed = CreateBlockSchema.safeParse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason") ?? undefined,
  });

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Données invalides.";
    redirect(`/admin/blocages?error=${encodeURIComponent(msg)}`);
  }

  const { startDate, endDate, reason } = parsed.data;

  // Guard against overlapping confirmed bookings
  const [conflict] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        lt(bookings.arrival_date, endDate),
        gt(bookings.departure_date, startDate),
      ),
    )
    .limit(1);

  if (conflict) {
    redirect(
      `/admin/blocages?error=${encodeURIComponent(
        "Ce créneau chevauche une réservation confirmée.",
      )}`,
    );
  }

  const [inserted] = await db
    .insert(availabilityBlocks)
    .values({ start_date: startDate, end_date: endDate, reason: reason ?? null })
    .returning({ id: availabilityBlocks.id });

  try {
    await logAdminAction({
      action: "CREATE_BLOCK",
      entityType: "availability_block",
      entityId: inserted?.id,
      details: { startDate, endDate, reason: reason ?? null },
    });
  } catch { /* audit failure must not block the main action */ }

  revalidatePath("/admin/blocages");
  revalidatePath("/admin/calendrier");
  redirect("/admin/blocages?success=1");
}

const UUID_RE =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function deleteBlock(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    redirect("/admin/blocages?error=Identifiant+invalide.");
  }

  await db.delete(availabilityBlocks).where(eq(availabilityBlocks.id, id));

  try {
    await logAdminAction({
      action: "DELETE_BLOCK",
      entityType: "availability_block",
      entityId: id,
    });
  } catch { /* audit failure must not block the main action */ }

  revalidatePath("/admin/blocages");
  revalidatePath("/admin/calendrier");
  redirect("/admin/blocages?deleted=1");
}
