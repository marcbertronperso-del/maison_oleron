import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { verifyPayPalWebhook } from "~/lib/paypal";
import { env } from "~/env.js";
import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { sendOwnerNotificationEmail, sendTenantConfirmationEmail } from "~/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const certUrl = req.headers.get("paypal-cert-url");
  const authAlgo = req.headers.get("paypal-auth-algo");
  const transmissionSig = req.headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return NextResponse.json({ error: "Missing PayPal webhook headers" }, { status: 400 });
  }

  let webhookBody: unknown;
  try {
    webhookBody = JSON.parse(body) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const isValid = await verifyPayPalWebhook({
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookBody,
    });
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (err) {
    console.warn("[paypal-webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const event = webhookBody as {
    event_type?: string;
    resource?: { id?: string };
  };

  try {
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const captureId = event.resource?.id;

      if (!captureId) {
        console.warn("[paypal-webhook] PAYMENT.CAPTURE.COMPLETED missing resource.id");
        return NextResponse.json({ received: true });
      }

      const [updated] = await db
        .update(bookings)
        .set({
          status: "confirmed",
          confirmed_at: new Date(),
        })
        .where(
          and(
            eq(bookings.paypal_order_id, captureId),
            eq(bookings.status, "pending"),
          ),
        )
        .returning({
          id: bookings.id,
          tenantName: bookings.tenant_name,
          tenantEmail: bookings.tenant_email,
          arrivalDate: bookings.arrival_date,
          departureDate: bookings.departure_date,
          totalPrice: bookings.total_price,
          depositAmount: bookings.deposit_amount,
        });

      if (updated) {
        const emailData = {
          bookingId: updated.id,
          tenantName: updated.tenantName,
          tenantEmail: updated.tenantEmail,
          arrivalDate: updated.arrivalDate,
          departureDate: updated.departureDate,
          totalPriceCents: updated.totalPrice,
          depositAmountCents: updated.depositAmount,
        };

        console.log("[booking:confirmed]", {
          bookingId: updated.id,
          tenantEmail: updated.tenantEmail,
          arrivalDate: updated.arrivalDate,
          departureDate: updated.departureDate,
          depositAmountCents: updated.depositAmount,
          totalPriceCents: updated.totalPrice,
          paypalCaptureId: captureId,
        });

        try {
          await sendTenantConfirmationEmail(emailData);
        } catch (emailErr) {
          Sentry.captureException(emailErr, {
            extra: { context: "tenant_confirmation_email", bookingId: updated.id },
          });
          console.error("[paypal-webhook] tenant email failed:", emailErr);
        }

        try {
          await sendOwnerNotificationEmail(emailData, env.ADMIN_EMAIL);
        } catch (emailErr) {
          Sentry.captureException(emailErr, {
            extra: { context: "owner_notification_email", bookingId: updated.id },
          });
          console.error("[paypal-webhook] owner email failed:", emailErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    Sentry.captureException(err, {
      extra: { eventType: event.event_type },
    });
    console.error("[paypal-webhook] processing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
