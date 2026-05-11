import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { slotHolds } from "~/server/db/schema";
import { getPricePerNight, getDiscountRate } from "~/lib/booking-rules";
import { countNights } from "~/lib/pricing";
import { MS_PER_DAY, toUTCMs } from "~/lib/date-utils";
import { cn } from "~/lib/utils";
import { SlotHoldTimer } from "~/components/booking/SlotHoldTimer";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatEUR(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " EUR"
  );
}

function formatDateFR(iso: string): string {
  const d = parseInt(iso.slice(8), 10);
  const m = parseInt(iso.slice(5, 7), 10) - 1;
  return `${d} ${MONTH_NAMES_FR[m]!} ${iso.slice(0, 4)}`;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ["Récapitulatif", "Coordonnées", "Paiement"] as const;

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Étapes de réservation">
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const num = i + 1;
          const isActive = num === currentStep;
          return (
            <li key={label} className="flex items-start">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {num}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="mx-2 mt-4 h-px w-12 shrink-0 bg-border sm:w-20"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReserverRecapPage({
  params,
}: {
  params: Promise<{ slotHoldId: string }>;
}) {
  const { slotHoldId } = await params;

  const [hold] = await db
    .select()
    .from(slotHolds)
    .where(eq(slotHolds.id, slotHoldId))
    .limit(1);

  if (!hold || hold.expires_at <= new Date()) {
    redirect("/#disponibilites");
  }

  const {
    arrival_date: arrivalDate,
    departure_date: departureDate,
    expires_at: expiresAt,
  } = hold!;

  const nights = countNights(arrivalDate, departureDate);
  const pricePerNight = getPricePerNight(arrivalDate);
  const subtotal = nights * pricePerNight;
  const discountRate = getDiscountRate(arrivalDate, departureDate);
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal - discountAmount;
  const deposit = Math.round(total * 0.3);
  const balance = total - deposit;
  const balanceDeadlineISO = new Date(toUTCMs(arrivalDate) - 30 * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-8rem)] py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

        {/* ── Step indicator ───────────────────────────────────────── */}
        <StepIndicator currentStep={1} />

        {/* ── Timer ───────────────────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Créneau réservé</span>
          <SlotHoldTimer
            slotHoldId={slotHoldId}
            expiresAt={expiresAt.toISOString()}
          />
        </div>

        {/* ── Heading ─────────────────────────────────────────────── */}
        <h1 className="mt-8 font-heading text-2xl text-foreground">
          Récapitulatif de votre réservation
        </h1>

        {/* ── Breakdown card ──────────────────────────────────────── */}
        <div className="mt-4 space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">

          {/* Dates */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Arrivée</span>
              <span className="font-medium text-foreground">{formatDateFR(arrivalDate)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Départ</span>
              <span className="font-medium text-foreground">{formatDateFR(departureDate)}</span>
            </div>
          </div>

          <div aria-hidden="true" className="border-t border-border" />

          {/* Price lines */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                {nights}&nbsp;nuit{nights > 1 ? "s" : ""}&nbsp;×&nbsp;{formatEUR(pricePerNight)}
              </span>
              <span className="text-foreground">{formatEUR(subtotal)}</span>
            </div>
            {discountRate > 0 && (
              <div className="flex justify-between gap-2 text-success">
                <span>Remise 2&nbsp;semaines (−15&nbsp;%)</span>
                <span>−&nbsp;{formatEUR(discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2 border-t border-border pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="text-primary-text">{formatEUR(total)}</span>
          </div>

          {/* Deposit / balance */}
          <div className="space-y-1.5 rounded-lg bg-secondary px-4 py-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Acompte (30&nbsp;%)</span>
              <span className="font-medium text-foreground">{formatEUR(deposit)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Solde (70&nbsp;%)</span>
              <span className="font-medium text-foreground">{formatEUR(balance)}</span>
            </div>
            <p className="pt-0.5 text-xs text-muted-foreground">
              Solde dû avant le {formatDateFR(balanceDeadlineISO)}
            </p>
          </div>
        </div>

        {/* ── Check-in / check-out ────────────────────────────────── */}
        <div className="mt-3 space-y-1 rounded-lg bg-muted px-4 py-3 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Check-in</span>
            <span className="font-medium text-foreground">à partir de 16h00</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Check-out</span>
            <span className="font-medium text-foreground">avant 10h00</span>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="mt-8">
          <Link
            href={`/reserver/${slotHoldId}/coordonnees`}
            className="flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Continuer
          </Link>
        </div>

      </div>
    </main>
  );
}
