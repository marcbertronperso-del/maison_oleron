import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { sendBalanceReminderEmail } from "~/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Target: confirmed bookings whose arrival is exactly 35 days from today (UTC)
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + 35);
  const targetDate = target.toISOString().slice(0, 10);

  const due = await db
    .select({
      id: bookings.id,
      tenantName: bookings.tenant_name,
      tenantEmail: bookings.tenant_email,
      arrivalDate: bookings.arrival_date,
      departureDate: bookings.departure_date,
      totalPrice: bookings.total_price,
      depositAmount: bookings.deposit_amount,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.arrival_date, targetDate),
        eq(bookings.status, "confirmed"),
      ),
    );

  let sent = 0;
  let failed = 0;

  for (const booking of due) {
    try {
      await sendBalanceReminderEmail({
        bookingId: booking.id,
        tenantName: booking.tenantName,
        tenantEmail: booking.tenantEmail,
        arrivalDate: booking.arrivalDate,
        departureDate: booking.departureDate,
        totalPriceCents: booking.totalPrice,
        depositAmountCents: booking.depositAmount,
      });
      sent++;
    } catch (err) {
      failed++;
      Sentry.captureException(err, {
        extra: { context: "balance_reminder_email", bookingId: booking.id },
      });
      console.error("[cron:reminder-emails] email failed for booking", booking.id, err);
    }
  }

  console.log(`[cron:reminder-emails] targetDate=${targetDate} sent=${sent} failed=${failed}`);

  return NextResponse.json({ targetDate, sent, failed });
}
