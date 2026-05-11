import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt, lt, ne } from "drizzle-orm";
import { db } from "~/server/db";
import { bookings, slotHolds } from "~/server/db/schema";
import { isValidBookingPeriod, getPricePerNight, getDiscountRate } from "~/lib/booking-rules";
import { countNights } from "~/lib/pricing";
import { sendTenantBookingRequestEmail, sendAdminNewRequestEmail } from "~/lib/email";

const BookingSchema = z.object({
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "arrivalDate must be YYYY-MM-DD"),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "departureDate must be YYYY-MM-DD"),
  tenantName: z.string().min(1).max(255),
  tenantEmail: z.string().email().max(255),
  tenantPhone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  excludeHoldId: z.string().uuid().optional(),
});

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json() as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { arrivalDate, departureDate, tenantName, tenantEmail, tenantPhone, excludeHoldId } = parsed.data;

  if (!isValidBookingPeriod(arrivalDate, departureDate)) {
    return NextResponse.json(
      { error: "Invalid booking period", code: "INVALID_PERIOD" },
      { status: 400 },
    );
  }

  let nights: number;
  let totalPriceCents: number;
  let depositAmountCents: number;
  let pricePerNight: number;
  let subtotalCents: number;
  let discountCents: number;

  try {
    nights = countNights(arrivalDate, departureDate);
    pricePerNight = getPricePerNight(arrivalDate);
    subtotalCents = nights * pricePerNight * 100;
    const discountRate = getDiscountRate(arrivalDate, departureDate);
    discountCents = Math.round(subtotalCents * discountRate);
    totalPriceCents = subtotalCents - discountCents;
    depositAmountCents = Math.round(totalPriceCents * 0.3);
  } catch (err) {
    console.error("[bookings] Price calculation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  try {
    const bookingId = await db.transaction(async (tx) => {
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
            excludeHoldId ? ne(slotHolds.id, excludeHoldId) : undefined,
          ),
        );
      if (conflictingHolds.length > 0) return null;

      const [inserted] = await tx
        .insert(bookings)
        .values({
          arrival_date: arrivalDate,
          departure_date: departureDate,
          tenant_name: tenantName,
          tenant_email: tenantEmail,
          tenant_phone: tenantPhone,
          total_price: totalPriceCents,
          deposit_amount: depositAmountCents,
          status: "pending",
        })
        .returning({ id: bookings.id });

      if (!inserted) throw new Error("booking insert returned no rows");

      if (excludeHoldId) {
        await tx.delete(slotHolds).where(eq(slotHolds.id, excludeHoldId));
      }

      return inserted.id;
    });

    if (bookingId === null) {
      return NextResponse.json(
        { error: "Slot unavailable", code: "SLOT_UNAVAILABLE" },
        { status: 409 },
      );
    }

    const deadlineDate = addDays(new Date().toISOString().slice(0, 10), 2);
    const emailData = {
      bookingId,
      tenantName,
      tenantEmail,
      tenantPhone,
      arrivalDate,
      departureDate,
      nights,
      pricePerNight,
      subtotalCents,
      discountCents,
      totalPriceCents,
      depositAmountCents,
      deadlineDate,
    };

    const ownerEmail = process.env.ADMIN_EMAIL;
    await Promise.allSettled([
      sendTenantBookingRequestEmail(emailData),
      ownerEmail ? sendAdminNewRequestEmail(emailData, ownerEmail) : Promise.resolve(),
    ]);

    return NextResponse.json({ data: { bookingId } }, { status: 201 });
  } catch (error) {
    console.error("[bookings] DB error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
