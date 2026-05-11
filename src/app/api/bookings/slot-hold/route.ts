import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "~/server/db";
import { bookings, slotHolds } from "~/server/db/schema";
import { isValidBookingPeriod } from "~/lib/booking-rules";

const SlotHoldSchema = z.object({
  arrivalDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "arrivalDate must be YYYY-MM-DD"),
  departureDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "departureDate must be YYYY-MM-DD"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json() as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SlotHoldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { arrivalDate, departureDate } = parsed.data;

  if (!isValidBookingPeriod(arrivalDate, departureDate)) {
    return NextResponse.json(
      { error: "Invalid booking period", code: "INVALID_PERIOD" },
      { status: 400 },
    );
  }

  try {
    const holdId = await db.transaction(async (tx) => {
      const conflictingBookings = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "confirmed"),
            lt(bookings.arrival_date, departureDate),
            gt(bookings.departure_date, arrivalDate),
          ),
        );
      if (conflictingBookings.length > 0) return null;

      const conflictingHolds = await tx
        .select({ id: slotHolds.id })
        .from(slotHolds)
        .where(
          and(
            gt(slotHolds.expires_at, new Date()),
            lt(slotHolds.arrival_date, departureDate),
            gt(slotHolds.departure_date, arrivalDate),
          ),
        );
      if (conflictingHolds.length > 0) return null;

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const inserted = await tx
        .insert(slotHolds)
        .values({
          arrival_date: arrivalDate,
          departure_date: departureDate,
          booking_reference: crypto.randomUUID(),
          expires_at: expiresAt,
        })
        .returning({ id: slotHolds.id, expires_at: slotHolds.expires_at });

      const hold = inserted[0];
      if (!hold) throw new Error("slot_hold insert returned no rows");
      return hold;
    });

    if (holdId === null) {
      return NextResponse.json(
        { error: "Slot unavailable", code: "SLOT_UNAVAILABLE" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        data: {
          slotHoldId: holdId.id,
          expiresAt: holdId.expires_at.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[slot-hold] DB error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
