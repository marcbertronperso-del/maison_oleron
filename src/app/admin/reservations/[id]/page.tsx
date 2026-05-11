import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { cn } from "~/lib/utils";
import { countNights } from "~/lib/pricing";

// ── Formatters ────────────────────────────────────────────────────────────────

const MONTH_NAMES_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
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

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-200",
  confirmed: "bg-green-100 text-green-800 ring-green-200",
  cancelled: "bg-red-100 text-red-700 ring-red-200",
  refunded: "bg-gray-100 text-gray-600 ring-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        STATUS_CLASSES[status] ?? STATUS_CLASSES.pending,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Section layout helper ─────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <dl className="space-y-3">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) notFound();

  const nights = countNights(booking.arrival_date, booking.departure_date);
  const balance = booking.total_price - booking.deposit_amount;
  const provider = booking.stripe_payment_id
    ? "Stripe"
    : booking.paypal_order_id
      ? "PayPal"
      : "—";
  const paymentRef = booking.stripe_payment_id ?? booking.paypal_order_id ?? "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back + title */}
      <div>
        <Link
          href="/admin/calendrier"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Retour au calendrier
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="font-heading text-xl text-foreground">
            {booking.tenant_name}
          </h1>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{booking.id}</p>
      </div>

      {/* Locataire */}
      <Section title="Locataire">
        <Row label="Nom" value={booking.tenant_name} />
        <Row
          label="Email"
          value={
            <a
              href={`mailto:${booking.tenant_email}`}
              className="text-primary underline underline-offset-2 hover:text-primary-hover"
            >
              {booking.tenant_email}
            </a>
          }
        />
        <Row label="Téléphone" value={booking.tenant_phone} />
      </Section>

      {/* Séjour */}
      <Section title="Séjour">
        <Row label="Arrivée" value={formatDateFR(booking.arrival_date)} />
        <Row label="Départ" value={formatDateFR(booking.departure_date)} />
        <Row label="Durée" value={`${nights} nuit${nights > 1 ? "s" : ""}`} />
      </Section>

      {/* Paiement */}
      <Section title="Paiement">
        <Row label="Total séjour" value={formatEUR(booking.total_price)} />
        <Row label="Acompte réglé" value={formatEUR(booking.deposit_amount)} />
        <Row
          label="Solde restant"
          value={
            <span className={balance > 0 ? "text-amber-700" : "text-green-700"}>
              {formatEUR(balance)}
            </span>
          }
        />
        <Row label="Moyen de paiement" value={provider} />
        <Row
          label="Référence paiement"
          value={
            <span className="font-mono text-xs">{paymentRef}</span>
          }
        />
      </Section>

      {/* Dates système */}
      <Section title="Historique">
        <Row
          label="Créée le"
          value={formatDateTime(booking.created_at)}
        />
        {booking.confirmed_at && (
          <Row
            label="Confirmée le"
            value={formatDateTime(booking.confirmed_at)}
          />
        )}
      </Section>
    </div>
  );
}
