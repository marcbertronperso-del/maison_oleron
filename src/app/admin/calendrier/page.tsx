import Link from "next/link";
import { and, gte, lte } from "drizzle-orm";
import { db } from "~/server/db";
import { availabilityBlocks, bookings } from "~/server/db/schema";
import { cn } from "~/lib/utils";

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseMonthParam(raw: string | undefined): { year: number; month: number } {
  if (raw && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number) as [number, number];
    return { year: y, month: m };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function adjacentMonth(year: number, month: number, delta: -1 | 1) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingRow = {
  id: string;
  tenantName: string;
  arrivalDate: string;
  departureDate: string;
};

type BlockRow = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

type DayState =
  | { kind: "booking"; booking: BookingRow; isArrival: boolean; isDeparture: boolean }
  | { kind: "block"; block: BlockRow }
  | { kind: "free" };

// ── Build day map ─────────────────────────────────────────────────────────────

function buildDayMap(
  year: number,
  month: number,
  bookingRows: BookingRow[],
  blockRows: BlockRow[],
): Map<string, DayState> {
  const map = new Map<string, DayState>();
  const days = daysInMonth(year, month);

  for (let d = 1; d <= days; d++) {
    const iso = isoDate(year, month, d);
    const booking = bookingRows.find(
      (b) => b.arrivalDate <= iso && iso <= b.departureDate,
    );
    if (booking) {
      map.set(iso, {
        kind: "booking",
        booking,
        isArrival: iso === booking.arrivalDate,
        isDeparture: iso === booking.departureDate,
      });
      continue;
    }
    const block = blockRows.find(
      (b) => b.startDate <= iso && iso <= b.endDate,
    );
    if (block) {
      map.set(iso, { kind: "block", block });
      continue;
    }
    map.set(iso, { kind: "free" });
  }
  return map;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ── Page ──────────────────────────────────────────────────────────────────────

export const metadata = { title: "Calendrier — Administration" };

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonthParam(monthParam);

  const firstDay = isoDate(year, month, 1);
  const lastDay = isoDate(year, month, daysInMonth(year, month));

  const [bookingRows, blockRows] = await Promise.all([
    db
      .select({
        id: bookings.id,
        tenantName: bookings.tenant_name,
        arrivalDate: bookings.arrival_date,
        departureDate: bookings.departure_date,
      })
      .from(bookings)
      .where(
        and(
          lte(bookings.arrival_date, lastDay),
          gte(bookings.departure_date, firstDay),
        ),
      ),
    db
      .select({
        id: availabilityBlocks.id,
        startDate: availabilityBlocks.start_date,
        endDate: availabilityBlocks.end_date,
        reason: availabilityBlocks.reason,
      })
      .from(availabilityBlocks)
      .where(
        and(
          lte(availabilityBlocks.start_date, lastDay),
          gte(availabilityBlocks.end_date, firstDay),
        ),
      ),
  ]);

  const dayMap = buildDayMap(year, month, bookingRows, blockRows);

  // Build grid cells (null = empty leading/trailing cell)
  const firstDayOfWeek = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl text-foreground">Calendrier</h1>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/calendrier?month=${adjacentMonth(year, month, -1)}`}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Mois précédent"
          >
            ←
          </Link>
          <span className="min-w-[140px] text-center text-sm font-medium text-foreground">
            {MONTH_NAMES_FR[month - 1]} {year}
          </span>
          <Link
            href={`/admin/calendrier?month=${adjacentMonth(year, month, 1)}`}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Mois suivant"
          >
            →
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary/20 ring-1 ring-primary/40" />
          Réservation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-muted ring-1 ring-border" />
          Bloqué
        </span>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border/50 last:border-r-0" />;
            }

            const iso = isoDate(year, month, day);
            const state = dayMap.get(iso) ?? { kind: "free" as const };
            const isToday = iso === new Date().toISOString().slice(0, 10);

            return (
              <div
                key={iso}
                className={cn(
                  "relative min-h-[80px] border-b border-r border-border/50 p-1.5 last:border-r-0",
                  state.kind === "booking" && "bg-primary/10",
                  state.kind === "block" && "bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday
                      ? "bg-primary font-semibold text-white"
                      : "text-muted-foreground",
                  )}
                >
                  {day}
                </span>

                {state.kind === "booking" && state.isArrival && (
                  <Link
                    href={`/admin/reservations/${state.booking.id}`}
                    className="mt-1 block truncate rounded-sm bg-primary/20 px-1 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/30 hover:bg-primary/30"
                  >
                    {state.booking.tenantName}
                  </Link>
                )}

                {state.kind === "block" && state.block.reason && (
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {state.block.reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking list below calendar */}
      {bookingRows.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Réservations ce mois
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {bookingRows.map((b) => (
              <Link
                key={b.id}
                href={`/admin/reservations/${b.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="font-medium text-foreground">{b.tenantName}</span>
                <span className="text-muted-foreground">
                  {b.arrivalDate} → {b.departureDate}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
