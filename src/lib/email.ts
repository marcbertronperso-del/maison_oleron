import { Resend } from "resend";
import { env } from "~/env.js";

const resend = new Resend(env.RESEND_API_KEY);

const MONTH_NAMES_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDateFR(iso: string): string {
  const d = parseInt(iso.slice(8), 10);
  const m = parseInt(iso.slice(5, 7), 10) - 1;
  return `${d} ${MONTH_NAMES_FR[m]!} ${iso.slice(0, 4)}`;
}

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export interface BookingEmailData {
  bookingId: string;
  tenantName: string;
  tenantEmail: string;
  arrivalDate: string;
  departureDate: string;
  totalPriceCents: number;
  depositAmountCents: number;
}

function buildTenantConfirmationHtml(data: BookingEmailData): string {
  const balance = data.totalPriceCents - data.depositAmountCents;
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Confirmation de réservation</title></head>
<body style="font-family:Georgia,serif;background:#f5f0e8;margin:0;padding:32px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#ffffff;border-radius:8px;padding:40px;border:1px solid #e5ddd0;">

      <h1 style="font-size:24px;color:#2d2011;margin:0 0 8px;">Réservation confirmée</h1>
      <p style="color:#8b7355;margin:0 0 32px;font-size:14px;">Maison Oléron — Île d'Oléron</p>

      <p style="color:#2d2011;margin:0 0 24px;">Bonjour ${data.tenantName},</p>
      <p style="color:#4a3728;line-height:1.6;margin:0 0 32px;">
        Nous avons bien reçu votre acompte. Votre réservation est confirmée.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9f6f0;border-radius:6px;padding:24px;margin-bottom:32px;">
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">Arrivée</td>
          <td style="padding:6px 0;color:#2d2011;font-weight:bold;text-align:right;">${arrival}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">Départ</td>
          <td style="padding:6px 0;color:#2d2011;font-weight:bold;text-align:right;">${departure}</td>
        </tr>
        <tr><td colspan="2" style="padding:12px 0 0;">
          <hr style="border:none;border-top:1px solid #e5ddd0;margin:0;">
        </td></tr>
        <tr>
          <td style="padding:12px 0 6px;color:#8b7355;font-size:13px;">Acompte réglé</td>
          <td style="padding:12px 0 6px;color:#2d2011;font-weight:bold;text-align:right;">${formatEUR(data.depositAmountCents)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">Solde à régler (J−35)</td>
          <td style="padding:6px 0;color:#2d2011;font-weight:bold;text-align:right;">${formatEUR(balance)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">Total séjour</td>
          <td style="padding:6px 0;color:#2d2011;font-weight:bold;text-align:right;">${formatEUR(data.totalPriceCents)}</td>
        </tr>
      </table>

      <p style="color:#4a3728;line-height:1.6;margin:0 0 16px;font-size:14px;">
        Le solde de <strong>${formatEUR(balance)}</strong> vous sera demandé 35 jours avant votre arrivée.
      </p>
      <p style="color:#4a3728;line-height:1.6;margin:0 0 32px;font-size:14px;">
        Pour toute question, répondez directement à cet email.
      </p>

      <p style="color:#8b7355;font-size:12px;border-top:1px solid #e5ddd0;padding-top:16px;margin:0;">
        Référence : ${data.bookingId}
      </p>
    </td></tr>
  </table>
  </td></tr></table>
</body></html>`;
}

function buildOwnerNotificationHtml(data: BookingEmailData): string {
  const balance = data.totalPriceCents - data.depositAmountCents;
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Nouvelle réservation</title></head>
<body style="font-family:monospace;background:#f5f5f5;margin:0;padding:32px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #ddd;">

      <h2 style="margin:0 0 24px;font-size:18px;color:#111;">
        Nouvelle réservation confirmée
      </h2>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#555;font-size:13px;width:160px;">Locataire</td>
          <td style="padding:4px 0;font-weight:bold;font-size:13px;">${data.tenantName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;font-size:13px;">Email</td>
          <td style="padding:4px 0;font-size:13px;">${data.tenantEmail}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;font-size:13px;">Arrivée</td>
          <td style="padding:4px 0;font-weight:bold;font-size:13px;">${arrival}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;font-size:13px;">Départ</td>
          <td style="padding:4px 0;font-weight:bold;font-size:13px;">${departure}</td>
        </tr>
        <tr><td colspan="2" style="padding:8px 0;">
          <hr style="border:none;border-top:1px solid #eee;margin:0;">
        </td></tr>
        <tr>
          <td style="padding:4px 0;color:#555;font-size:13px;">Acompte reçu</td>
          <td style="padding:4px 0;font-weight:bold;font-size:13px;">${formatEUR(data.depositAmountCents)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;font-size:13px;">Solde (J−35)</td>
          <td style="padding:4px 0;font-size:13px;">${formatEUR(balance)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;font-size:13px;">Total</td>
          <td style="padding:4px 0;font-weight:bold;font-size:13px;">${formatEUR(data.totalPriceCents)}</td>
        </tr>
        <tr><td colspan="2" style="padding:8px 0;">
          <hr style="border:none;border-top:1px solid #eee;margin:0;">
        </td></tr>
        <tr>
          <td style="padding:4px 0;color:#555;font-size:13px;">Référence</td>
          <td style="padding:4px 0;font-size:12px;color:#888;">${data.bookingId}</td>
        </tr>
      </table>

    </td></tr>
  </table>
  </td></tr></table>
</body></html>`;
}

export async function sendOwnerNotificationEmail(
  data: BookingEmailData,
  ownerEmail: string,
): Promise<void> {
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  await resend.emails.send({
    from: `Maison Oléron <${env.RESEND_FROM}>`,
    to: ownerEmail,
    subject: `[Réservation] ${data.tenantName} — ${arrival} au ${departure}`,
    html: buildOwnerNotificationHtml(data),
  });
}

function buildBalanceReminderHtml(data: BookingEmailData): string {
  const balance = data.totalPriceCents - data.depositAmountCents;
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Solde de séjour</title></head>
<body style="font-family:Georgia,serif;background:#f5f0e8;margin:0;padding:32px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#ffffff;border-radius:8px;padding:40px;border:1px solid #e5ddd0;">

      <h1 style="font-size:22px;color:#2d2011;margin:0 0 8px;">Solde de votre séjour</h1>
      <p style="color:#8b7355;margin:0 0 32px;font-size:14px;">Maison Oléron — Île d'Oléron</p>

      <p style="color:#2d2011;margin:0 0 16px;">Bonjour ${data.tenantName},</p>
      <p style="color:#4a3728;line-height:1.6;margin:0 0 32px;">
        Votre arrivée approche ! Voici un rappel du solde restant à régler
        pour votre séjour du <strong>${arrival}</strong> au <strong>${departure}</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9f6f0;border-radius:6px;padding:24px;margin-bottom:32px;">
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">Acompte réglé</td>
          <td style="padding:6px 0;color:#2d2011;font-size:13px;text-align:right;">${formatEUR(data.depositAmountCents)}</td>
        </tr>
        <tr><td colspan="2" style="padding:8px 0;">
          <hr style="border:none;border-top:1px solid #e5ddd0;margin:0;">
        </td></tr>
        <tr>
          <td style="padding:8px 0 4px;color:#2d2011;font-weight:bold;">Solde à régler</td>
          <td style="padding:8px 0 4px;color:#2d2011;font-weight:bold;font-size:18px;text-align:right;">${formatEUR(balance)}</td>
        </tr>
      </table>

      <p style="color:#4a3728;line-height:1.6;margin:0 0 32px;font-size:14px;">
        Pour régler ce solde, répondez à cet email et nous vous communiquerons
        les modalités de paiement.
      </p>

      <p style="color:#8b7355;font-size:12px;border-top:1px solid #e5ddd0;padding-top:16px;margin:0;">
        Référence : ${data.bookingId}
      </p>
    </td></tr>
  </table>
  </td></tr></table>
</body></html>`;
}

export async function sendBalanceReminderEmail(data: BookingEmailData): Promise<void> {
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  await resend.emails.send({
    from: `Maison Oléron <${env.RESEND_FROM}>`,
    to: data.tenantEmail,
    subject: `Rappel solde — séjour du ${arrival} au ${departure}`,
    html: buildBalanceReminderHtml(data),
  });
}

export interface BookingRequestEmailData {
  bookingId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  pricePerNight: number;
  subtotalCents: number;
  discountCents: number;
  totalPriceCents: number;
  depositAmountCents: number;
  deadlineDate: string;
}

function buildTenantRequestHtml(data: BookingRequestEmailData): string {
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  const deadline = formatDateFR(data.deadlineDate);
  const balance = data.totalPriceCents - data.depositAmountCents;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Demande de réservation</title></head>
<body style="font-family:Georgia,serif;background:#f5f0e8;margin:0;padding:32px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#ffffff;border-radius:8px;padding:40px;border:1px solid #e5ddd0;">

      <h1 style="font-size:24px;color:#2d2011;margin:0 0 8px;">Demande de réservation reçue</h1>
      <p style="color:#8b7355;margin:0 0 32px;font-size:14px;">Maison Oléron — Île d'Oléron</p>

      <p style="color:#2d2011;margin:0 0 16px;">Bonjour ${data.tenantName},</p>
      <p style="color:#4a3728;line-height:1.6;margin:0 0 32px;">
        Nous avons bien reçu votre demande de réservation. Pour la confirmer,
        vous devez nous verser l'acompte ci-dessous <strong>avant le ${deadline}</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9f6f0;border-radius:6px;padding:24px;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">Arrivée</td>
          <td style="padding:6px 0;color:#2d2011;font-weight:bold;text-align:right;">${arrival}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">Départ</td>
          <td style="padding:6px 0;color:#2d2011;font-weight:bold;text-align:right;">${departure}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">Durée</td>
          <td style="padding:6px 0;color:#2d2011;text-align:right;">${data.nights} nuit${data.nights > 1 ? "s" : ""}</td>
        </tr>
        <tr><td colspan="2" style="padding:8px 0;">
          <hr style="border:none;border-top:1px solid #e5ddd0;margin:0;">
        </td></tr>
        <tr>
          <td style="padding:6px 0;color:#8b7355;font-size:13px;">${data.nights} nuits × ${formatEUR(data.pricePerNight * 100)}</td>
          <td style="padding:6px 0;color:#2d2011;text-align:right;">${formatEUR(data.subtotalCents)}</td>
        </tr>
        ${data.discountCents > 0 ? `<tr>
          <td style="padding:6px 0;color:#5a8a5a;font-size:13px;">Remise séjour</td>
          <td style="padding:6px 0;color:#5a8a5a;text-align:right;">−${formatEUR(data.discountCents)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:6px 0;color:#2d2011;font-weight:bold;">Total séjour</td>
          <td style="padding:6px 0;color:#2d2011;font-weight:bold;text-align:right;">${formatEUR(data.totalPriceCents)}</td>
        </tr>
        <tr><td colspan="2" style="padding:8px 0;">
          <hr style="border:none;border-top:1px solid #e5ddd0;margin:0;">
        </td></tr>
        <tr>
          <td style="padding:8px 0 4px;color:#2d2011;font-weight:bold;font-size:15px;">Acompte à verser (30 %)</td>
          <td style="padding:8px 0 4px;color:#2d2011;font-weight:bold;font-size:18px;text-align:right;">${formatEUR(data.depositAmountCents)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0 6px;color:#8b7355;font-size:13px;">Solde restant</td>
          <td style="padding:4px 0 6px;color:#8b7355;font-size:13px;text-align:right;">${formatEUR(balance)}</td>
        </tr>
      </table>

      <div style="background:#fff3cd;border-radius:6px;padding:16px;margin-bottom:24px;border-left:4px solid #f0ad4e;">
        <p style="margin:0;color:#856404;font-size:14px;line-height:1.6;">
          <strong>⚠ Confirmez avant le ${deadline}</strong><br>
          Sans versement de l'acompte dans ce délai, le créneau sera automatiquement libéré.
        </p>
      </div>

      <p style="color:#4a3728;line-height:1.6;margin:0 0 8px;font-size:14px;">
        Pour procéder au paiement de l'acompte, répondez directement à cet email
        et nous vous communiquerons nos coordonnées bancaires.
      </p>

      <p style="color:#8b7355;font-size:12px;border-top:1px solid #e5ddd0;padding-top:16px;margin:24px 0 0;">
        Référence : ${data.bookingId}
      </p>
    </td></tr>
  </table>
  </td></tr></table>
</body></html>`;
}

function buildAdminNewRequestHtml(data: BookingRequestEmailData): string {
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  const deadline = formatDateFR(data.deadlineDate);
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Nouvelle demande</title></head>
<body style="font-family:monospace;background:#f5f5f5;margin:0;padding:32px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #ddd;">
      <h2 style="margin:0 0 4px;font-size:18px;color:#111;">Nouvelle demande de réservation</h2>
      <p style="margin:0 0 24px;color:#888;font-size:13px;">À confirmer avant le ${deadline}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:4px 0;color:#555;font-size:13px;width:160px;">Locataire</td><td style="padding:4px 0;font-weight:bold;font-size:13px;">${data.tenantName}</td></tr>
        <tr><td style="padding:4px 0;color:#555;font-size:13px;">Email</td><td style="padding:4px 0;font-size:13px;">${data.tenantEmail}</td></tr>
        <tr><td style="padding:4px 0;color:#555;font-size:13px;">Téléphone</td><td style="padding:4px 0;font-size:13px;">${data.tenantPhone}</td></tr>
        <tr><td style="padding:4px 0;color:#555;font-size:13px;">Arrivée</td><td style="padding:4px 0;font-weight:bold;font-size:13px;">${arrival}</td></tr>
        <tr><td style="padding:4px 0;color:#555;font-size:13px;">Départ</td><td style="padding:4px 0;font-weight:bold;font-size:13px;">${departure}</td></tr>
        <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #eee;margin:0;"></td></tr>
        <tr><td style="padding:4px 0;color:#555;font-size:13px;">Total</td><td style="padding:4px 0;font-weight:bold;font-size:13px;">${formatEUR(data.totalPriceCents)}</td></tr>
        <tr><td style="padding:4px 0;color:#555;font-size:13px;">Acompte attendu</td><td style="padding:4px 0;font-weight:bold;font-size:13px;">${formatEUR(data.depositAmountCents)}</td></tr>
        <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #eee;margin:0;"></td></tr>
        <tr><td style="padding:4px 0;color:#555;font-size:13px;">Référence</td><td style="padding:4px 0;font-size:12px;color:#888;">${data.bookingId}</td></tr>
      </table>
    </td></tr>
  </table>
  </td></tr></table>
</body></html>`;
}

export async function sendTenantBookingRequestEmail(
  data: BookingRequestEmailData,
): Promise<void> {
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  await resend.emails.send({
    from: `Maison Oléron <${env.RESEND_FROM}>`,
    to: data.tenantEmail,
    subject: `Demande de réservation — ${arrival} au ${departure}`,
    html: buildTenantRequestHtml(data),
  });
}

export async function sendAdminNewRequestEmail(
  data: BookingRequestEmailData,
  ownerEmail: string,
): Promise<void> {
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  await resend.emails.send({
    from: `Maison Oléron <${env.RESEND_FROM}>`,
    to: ownerEmail,
    subject: `[Demande] ${data.tenantName} — ${arrival} au ${departure}`,
    html: buildAdminNewRequestHtml(data),
  });
}

export async function sendTenantConfirmationEmail(data: BookingEmailData): Promise<void> {
  const arrival = formatDateFR(data.arrivalDate);
  const departure = formatDateFR(data.departureDate);
  await resend.emails.send({
    from: `Maison Oléron <${env.RESEND_FROM}>`,
    to: data.tenantEmail,
    subject: `Réservation confirmée — ${arrival} au ${departure}`,
    html: buildTenantConfirmationHtml(data),
  });
}
