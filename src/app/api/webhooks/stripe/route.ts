import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { stripe } from "~/lib/stripe";
import { env } from "~/env.js";
import { db } from "~/server/db";
import { bookings, slotHolds } from "~/server/db/schema";
import { sendOwnerNotificationEmail, sendTenantConfirmationEmail } from "~/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.warn("[stripe-webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const bookingId = intent.metadata.bookingId;
      const slotHoldId = intent.metadata.slotHoldId;

      if (!bookingId) {
        console.warn("[stripe-webhook] payment_intent.succeeded missing bookingId", {
          intentId: intent.id,
        });
        return NextResponse.json({ received: true });
      }

      let confirmedBooking: {
        id: string;
        tenantName: string;
        tenantEmail: string;
        arrivalDate: string;
        departureDate: string;
        totalPrice: number;
        depositAmount: number;
      } | undefined;

      await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(bookings)
          .set({
            status: "confirmed",
            confirmed_at: new Date(),
            stripe_payment_id: intent.id,
          })
          .where(and(eq(bookings.id, bookingId), eq(bookings.status, "pending")))
          .returning({
            id: bookings.id,
            tenantName: bookings.tenant_name,
            tenantEmail: bookings.tenant_email,
            arrivalDate: bookings.arrival_date,
            departureDate: bookings.departure_date,
            totalPrice: bookings.total_price,
            depositAmount: bookings.deposit_amount,
          });

        // Only delete the slot hold if the booking was actually transitioned
        // (idempotency: a second webhook delivery finds no pending row → skip)
        if (updated && slotHoldId) {
          await tx.delete(slotHolds).where(eq(slotHolds.id, slotHoldId));
        }

        confirmedBooking = updated;
      });

      if (confirmedBooking) {
        const emailData = {
          bookingId: confirmedBooking.id,
          tenantName: confirmedBooking.tenantName,
          tenantEmail: confirmedBooking.tenantEmail,
          arrivalDate: confirmedBooking.arrivalDate,
          departureDate: confirmedBooking.departureDate,
          totalPriceCents: confirmedBooking.totalPrice,
          depositAmountCents: confirmedBooking.depositAmount,
        };

        console.log("[booking:confirmed]", {
          bookingId: confirmedBooking.id,
          tenantEmail: confirmedBooking.tenantEmail,
          arrivalDate: confirmedBooking.arrivalDate,
          departureDate: confirmedBooking.departureDate,
          depositAmountCents: confirmedBooking.depositAmount,
          totalPriceCents: confirmedBooking.totalPrice,
          stripeIntentId: intent.id,
        });

        try {
          await sendTenantConfirmationEmail(emailData);
        } catch (emailErr) {
          // Email failure must not trigger Stripe retry — booking is already confirmed
          Sentry.captureException(emailErr, {
            extra: { context: "tenant_confirmation_email", bookingId },
          });
          console.error("[stripe-webhook] tenant email failed:", emailErr);
        }

        try {
          await sendOwnerNotificationEmail(emailData, env.ADMIN_EMAIL);
        } catch (emailErr) {
          Sentry.captureException(emailErr, {
            extra: { context: "owner_notification_email", bookingId },
          });
          console.error("[stripe-webhook] owner email failed:", emailErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    Sentry.captureException(err, {
      extra: { eventType: event.type, eventId: event.id },
    });
    console.error("[stripe-webhook] processing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
