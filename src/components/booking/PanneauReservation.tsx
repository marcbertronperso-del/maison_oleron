"use client";

import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { getPricePerNight, getDiscountRate } from "~/lib/booking-rules";
import { countNights } from "~/lib/pricing";
import { MS_PER_DAY, toUTCMs } from "~/lib/date-utils";

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
    }).format(amount) + " EUR"
  );
}

function formatDateFR(iso: string): string {
  const d = parseInt(iso.slice(8), 10);
  const m = parseInt(iso.slice(5, 7), 10) - 1;
  return `${d} ${MONTH_NAMES_FR[m]!} ${iso.slice(0, 4)}`;
}

function addDays(dateISO: string, days: number): string {
  return new Date(toUTCMs(dateISO) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Breakdown {
  nights: number;
  pricePerNight: number;
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  deposit: number;
  balance: number;
  balanceDeadline: string;
}

function computeBreakdown(start: string, end: string): Breakdown {
  const nights = countNights(start, end);
  const pricePerNight = getPricePerNight(start);
  const subtotal = nights * pricePerNight;
  const discountRate = getDiscountRate(start, end);
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal - discountAmount;
  const deposit = Math.round(total * 0.3);
  const balance = total - deposit;
  const balanceDeadline = addDays(start, -30);
  return {
    nights,
    pricePerNight,
    subtotal,
    discountRate,
    discountAmount,
    total,
    deposit,
    balance,
    balanceDeadline,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <p className="py-3 text-center text-sm text-muted-foreground">
      Sélectionnez vos dates pour voir le prix
    </p>
  );
}

interface BreakdownContentProps {
  bd: Breakdown;
  start: string;
  end: string;
  onBook?: () => void;
  isBooking?: boolean;
}

function BreakdownContent({ bd, start, end, onBook, isBooking }: BreakdownContentProps) {
  return (
    <div className="space-y-4">
      {/* Date recap */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Arrivée</span>
          <span className="font-medium text-foreground">{formatDateFR(start)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Départ</span>
          <span className="font-medium text-foreground">{formatDateFR(end)}</span>
        </div>
      </div>

      <div className="border-t border-border" aria-hidden="true" />

      {/* Price lines */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">
            {bd.nights}&nbsp;nuit{bd.nights > 1 ? "s" : ""}{" "}
            × {formatEUR(bd.pricePerNight)}
          </span>
          <span className="text-foreground">{formatEUR(bd.subtotal)}</span>
        </div>
        {bd.discountRate > 0 && (
          <div className="flex justify-between gap-2 text-success">
            <span>Remise {Math.round(bd.nights / 7)}&nbsp;semaines (−15&nbsp;%)</span>
            <span>−&nbsp;{formatEUR(bd.discountAmount)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2 border-t border-border pt-3 text-base font-semibold">
        <span>Total</span>
        <span className="text-primary-text">{formatEUR(bd.total)}</span>
      </div>

      {/* Deposit / balance breakdown */}
      <div className="rounded-lg bg-secondary px-4 py-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Acompte (30&nbsp;%)</span>
          <span className="font-medium text-foreground">{formatEUR(bd.deposit)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Solde (70&nbsp;%)</span>
          <span className="font-medium text-foreground">{formatEUR(bd.balance)}</span>
        </div>
        <p className="pt-0.5 text-xs text-muted-foreground">
          Solde dû avant le {formatDateFR(bd.balanceDeadline)}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onBook}
        disabled={isBooking}
        className={cn(
          "w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground",
          "transition-colors hover:bg-primary-hover",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isBooking ? "Réservation en cours…" : "Réserver ce créneau"}
      </button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface PanneauReservationProps {
  selectedStart: string | null;
  selectedEnd: string | null;
  onBook?: () => void;
  isBooking?: boolean;
}

export function PanneauReservation({
  selectedStart,
  selectedEnd,
  onBook,
  isBooking,
}: PanneauReservationProps) {
  const breakdown = useMemo(() => {
    if (!selectedStart || !selectedEnd) return null;
    try {
      return computeBreakdown(selectedStart, selectedEnd);
    } catch {
      return null;
    }
  }, [selectedStart, selectedEnd]);

  return (
    <>
      {/* ── Desktop: sticky sidebar (≥ 1024px) ─────────────────────────── */}
      <aside
        aria-label="Récapitulatif de réservation"
        className="hidden lg:block w-96 shrink-0 self-start sticky top-6"
      >
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {breakdown && selectedStart && selectedEnd ? (
            <BreakdownContent
              bd={breakdown}
              start={selectedStart}
              end={selectedEnd}
              onBook={onBook}
              isBooking={isBooking}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </aside>

      {/* ── Mobile: bottom sheet (< 1024px) ─────────────────────────────── */}
      <div
        role="complementary"
        aria-label="Récapitulatif de réservation"
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden rounded-t-2xl border-t border-border bg-card shadow-2xl"
      >
        {/* Handle */}
        <div
          className="mx-auto mb-1 mt-2.5 h-1 w-10 rounded-full bg-muted-foreground/25"
          aria-hidden="true"
        />

        {/* Compact summary row — always visible */}
        <div className="px-4 pb-2 pt-1">
          {breakdown ? (
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">
                {breakdown.nights}&nbsp;nuit{breakdown.nights > 1 ? "s" : ""}
              </span>
              <span className="font-semibold text-foreground">
                {formatEUR(breakdown.total)}
              </span>
            </div>
          ) : (
            <p className="py-1 text-center text-sm text-muted-foreground">
              Sélectionnez vos dates pour voir le prix
            </p>
          )}
        </div>

        {/* Expanding detail — slides open when breakdown is ready */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            breakdown ? "max-h-120" : "max-h-0",
          )}
          aria-hidden={!breakdown}
        >
          {breakdown && selectedStart && selectedEnd && (
            <div className="px-4 pb-6 pt-1">
              <BreakdownContent
                bd={breakdown}
                start={selectedStart}
                end={selectedEnd}
                onBook={onBook}
                isBooking={isBooking}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
