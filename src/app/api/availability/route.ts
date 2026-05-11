import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "~/server/db";
import { availabilityBlocks, bookings, slotHolds } from "~/server/db/schema";

const QuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

type DayState = "available" | "unavailable" | "hold";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = QuerySchema.safeParse({
    year: searchParams.get("year"),
    month: searchParams.get("month"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { year, month } = parsed.data;

  const monthStartISO = `${year}-${String(month).padStart(2, "0")}-01`;
  // Date.UTC(year, month, 1) = first day of next month (month is 0-indexed in Date)
  const nextMonthStartISO = new Date(Date.UTC(year, month, 1))
    .toISOString()
    .slice(0, 10);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  try {
    const [confirmedBookings, activeHolds, blocks] = await Promise.all([
      db
        .select({
          arrival: bookings.arrival_date,
          departure: bookings.departure_date,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "confirmed"),
            lt(bookings.arrival_date, nextMonthStartISO),
            gt(bookings.departure_date, monthStartISO),
          ),
        ),
      db
        .select({
          arrival: slotHolds.arrival_date,
          departure: slotHolds.departure_date,
        })
        .from(slotHolds)
        .where(
          and(
            gt(slotHolds.expires_at, new Date()),
            lt(slotHolds.arrival_date, nextMonthStartISO),
            gt(slotHolds.departure_date, monthStartISO),
          ),
        ),
      db
        .select({
          start: availabilityBlocks.start_date,
          end: availabilityBlocks.end_date,
        })
        .from(availabilityBlocks)
        .where(
          and(
            lt(availabilityBlocks.start_date, nextMonthStartISO),
            gt(availabilityBlocks.end_date, monthStartISO),
          ),
        ),
    ]);

    const data: Record<string, DayState> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const isUnavailable =
        confirmedBookings.some(
          (b) => b.arrival <= dateISO && dateISO < b.departure,
        ) ||
        blocks.some((b) => b.start <= dateISO && dateISO < b.end);

      if (isUnavailable) {
        data[dateISO] = "unavailable";
      } else if (
        activeHolds.some((h) => h.arrival <= dateISO && dateISO < h.departure)
      ) {
        data[dateISO] = "hold";
      } else {
        data[dateISO] = "available";
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[availability] DB error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
