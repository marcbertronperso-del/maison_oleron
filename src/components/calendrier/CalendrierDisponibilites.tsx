"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { isValidBookingPeriod } from "~/lib/booking-rules";
import { MS_PER_DAY, toUTCMs } from "~/lib/date-utils";

// Returns true for dates in July/August that fall on a non-Saturday (invalid arrival)
function isHighSeasonNonSaturday(dateISO: string): boolean {
  const month = parseInt(dateISO.slice(5, 7), 10);
  if (month !== 7 && month !== 8) return false;
  const year = parseInt(dateISO.slice(0, 4), 10);
  const day = parseInt(dateISO.slice(8), 10);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() !== 6;
}

function isoAddDays(dateISO: string, days: number): string {
  return new Date(toUTCMs(dateISO) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

interface Alternative {
  start: string;
  end: string;
}

// Find the nearest valid booking window of `nights` duration.
// direction="after": search starts ≥ anchorDate; direction="before": search ends ≤ anchorDate.
function findAlternative(
  anchorDate: string,
  nights: number,
  dayMap: DayMap,
  today: string,
  direction: "after" | "before",
): Alternative | null {
  const sorted = Object.keys(dayMap).sort();
  const candidates =
    direction === "after"
      ? sorted.filter((d) => d >= anchorDate && d >= today)
      : sorted
          .filter((d) => d <= isoAddDays(anchorDate, -nights) && d >= today)
          .reverse();

  for (const start of candidates) {
    const end = isoAddDays(start, nights);
    if (!isValidBookingPeriod(start, end)) continue;
    let ok = true;
    for (let j = 0; j < nights; j++) {
      const d = isoAddDays(start, j);
      if (dayMap[d] !== "available") { ok = false; break; }
    }
    if (ok) return { start, end };
  }
  return null;
}

type DayState = "available" | "unavailable" | "hold";
type DayMap = Record<string, DayState>;

interface Month {
  year: number;
  month: number;
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril",
  "Mai", "Juin", "Juillet", "Août",
  "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAY_NAMES_SHORT = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const DAY_NAMES_LONG = [
  "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche",
];

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getFirstDayOffset(year: number, month: number): number {
  // Mon=0 ... Sun=6 (European convention)
  const dow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (dow + 6) % 7;
}

function addMonths(year: number, month: number, delta: number): Month {
  let m = month + delta;
  let y = year;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  return { year: y, month: m };
}

function formatDateLabel(iso: string): string {
  const d = parseInt(iso.slice(8), 10);
  const m = parseInt(iso.slice(5, 7), 10) - 1;
  return `${d} ${MONTH_NAMES[m]!} ${iso.slice(0, 4)}`;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div
      className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0"
      role="status"
      aria-label="Chargement du calendrier des disponibilités"
      aria-busy="true"
    >
      {[0, 1].map((mi) => (
        <div key={mi} className="animate-pulse space-y-3">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Month grid ────────────────────────────────────────────────────────────────

interface MonthGridProps {
  year: number;
  month: number;
  dayMap: DayMap;
  today: string;
  selectedStart: string | null;
  selectedEnd: string | null;
  focusedDate: string;
  isInRange: (dateISO: string) => boolean;
  isRuleDisabled: (dateISO: string) => boolean;
  suggestionStarts: Set<string>;
  onSelect: (dateISO: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, dateISO: string) => void;
}

function MonthGrid({
  year,
  month,
  dayMap,
  today,
  selectedStart,
  selectedEnd,
  focusedDate,
  isInRange,
  isRuleDisabled,
  suggestionStarts,
  onSelect,
  onKeyDown,
}: MonthGridProps) {
  const offset = getFirstDayOffset(year, month);
  const count = getDaysInMonth(year, month);

  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: count }, (_, i) => toISO(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div>
      <h3 className="mb-4 font-heading text-xl text-foreground">
        {MONTH_NAMES[month - 1]} {year}
      </h3>

      <div
        role="grid"
        aria-label={`${MONTH_NAMES[month - 1]!} ${year}`}
        className="w-full select-none"
      >
        {/* Day-of-week headers */}
        <div role="row" className="mb-1 grid grid-cols-7 gap-1">
          {DAY_NAMES_SHORT.map((name, i) => (
            <div
              key={name}
              role="columnheader"
              aria-label={DAY_NAMES_LONG[i]}
              className="py-1 text-center text-xs font-medium text-muted-foreground"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {rows.map((row, ri) => (
          <div key={ri} role="row" className="mb-1 grid grid-cols-7 gap-1">
            {row.map((dateISO, ci) => {
              if (!dateISO) {
                return (
                  <div
                    key={`empty-${ri}-${ci}`}
                    role="gridcell"
                    aria-hidden="true"
                  />
                );
              }

              const day = parseInt(dateISO.slice(8), 10);
              const state = dayMap[dateISO];
              const isToday = dateISO === today;
              const isStart = dateISO === selectedStart;
              const isEnd = dateISO === selectedEnd;
              const inRange = isInRange(dateISO);
              const isUnavailable = state === "unavailable";
              const isHold = state === "hold";
              const isSelected = isStart || isEnd;
              const isFocused = dateISO === focusedDate;
              const isPast = dateISO < today;
              const isRuleInvalid = !isSelected && !isPast && !isUnavailable && isRuleDisabled(dateISO);
              const isDisabled = isUnavailable || isPast || isRuleInvalid;
              const isSuggestion = suggestionStarts.has(dateISO);

              return (
                <div
                  key={dateISO}
                  role="gridcell"
                  aria-selected={isSelected || inRange ? "true" : undefined}
                  aria-disabled={isDisabled ? "true" : undefined}
                >
                  <button
                    data-date={dateISO}
                    tabIndex={isFocused ? 0 : -1}
                    aria-label={[
                      `${day} ${MONTH_NAMES[month - 1]!} ${year}`,
                      isToday ? "(aujourd'hui)" : "",
                      isUnavailable ? "(indisponible)" : "",
                      isPast && !isUnavailable ? "(passé)" : "",
                      isHold ? "(option en cours)" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      if (!isDisabled) onSelect(dateISO);
                    }}
                    onKeyDown={(e) => onKeyDown(e, dateISO)}
                    className={cn(
                      "relative flex h-10 w-full flex-col items-center justify-center rounded-md text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                      // Available (future, not selected, not in range, not rule-blocked)
                      !isSelected &&
                        !inRange &&
                        !isUnavailable &&
                        !isHold &&
                        !isPast &&
                        !isRuleInvalid &&
                        "bg-card text-foreground hover:bg-secondary",
                      // Past
                      isPast &&
                        !isUnavailable &&
                        "cursor-default bg-card text-muted-foreground/40",
                      // Rule-blocked (wrong day for season rules)
                      isRuleInvalid &&
                        "cursor-not-allowed bg-card text-muted-foreground/35",
                      // Unavailable (API)
                      isUnavailable &&
                        "cursor-not-allowed bg-unavailable/70 text-muted-foreground line-through",
                      // Hold by another visitor
                      isHold &&
                        !isSelected &&
                        "bg-amber-100 text-amber-700 hover:bg-amber-200",
                      // Range between start and end
                      inRange &&
                        !isSelected &&
                        "rounded-none bg-primary/15 text-foreground",
                      // Selected start or end
                      isSelected &&
                        "bg-primary text-primary-foreground hover:bg-primary-hover",
                      // Suggested alternative arrival
                      isSuggestion &&
                        !isSelected &&
                        "ring-2 ring-primary/50 ring-offset-1",
                    )}
                  >
                    <span
                      className={cn(
                        "leading-none",
                        isToday && "underline decoration-2 underline-offset-2",
                      )}
                    >
                      {day}
                    </span>
                    {/* Availability dot: shown for bookable future dates only */}
                    {!isDisabled && !isHold && !isSelected && !inRange && (
                      <span
                        aria-hidden="true"
                        className="mt-0.5 h-1 w-1 rounded-full bg-success"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface CalendrierDisponibilitesProps {
  onSelectionChange?: (start: string | null, end: string | null) => void;
}

export function CalendrierDisponibilites({
  onSelectionChange,
}: CalendrierDisponibilitesProps = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const todayYear = parseInt(today.slice(0, 4), 10);
  const todayMonth = parseInt(today.slice(5, 7), 10);

  const [firstMonth, setFirstMonth] = useState<Month>({
    year: todayYear,
    month: todayMonth,
  });
  const [dayMap, setDayMap] = useState<DayMap>({});
  const [loading, setLoading] = useState(true);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [focusedDate, setFocusedDate] = useState<string>(today);

  // Track whether the next focusedDate change should move focus to the cell
  const shouldFocusCellRef = useRef(false);

  const months = useMemo<[Month, Month]>(
    () => [firstMonth, addMonths(firstMonth.year, firstMonth.month, 1)],
    [firstMonth],
  );

  const allDates = useMemo(() => {
    const dates: string[] = [];
    for (const { year, month } of months) {
      const n = getDaysInMonth(year, month);
      for (let d = 1; d <= n; d++) dates.push(toISO(year, month, d));
    }
    return dates;
  }, [months]);

  const fetchAvailability = useCallback(async () => {
    const [m0, m1] = months;
    try {
      const [res0, res1] = await Promise.all([
        fetch(`/api/availability?year=${m0.year}&month=${m0.month}`),
        fetch(`/api/availability?year=${m1.year}&month=${m1.month}`),
      ]);
      if (!res0.ok || !res1.ok) return;
      const [json0, json1] = (await Promise.all([
        res0.json(),
        res1.json(),
      ])) as [{ data: DayMap }, { data: DayMap }];
      setDayMap({ ...json0.data, ...json1.data });
    } catch {
      // silently ignore network errors between polls
    }
  }, [months]);

  // Initial fetch + refetch on month navigation
  useEffect(() => {
    setLoading(true);
    void fetchAvailability().finally(() => setLoading(false));
  }, [fetchAvailability]);

  // 12-second polling
  useEffect(() => {
    const id = setInterval(() => void fetchAvailability(), 12_000);
    return () => clearInterval(id);
  }, [fetchAvailability]);

  // Safety net: if focused date leaves the visible range, reset to first visible day
  useEffect(() => {
    if (!allDates.includes(focusedDate)) {
      setFocusedDate(allDates[0] ?? today);
    }
  }, [allDates, focusedDate, today]);

  // Focus the cell after keyboard arrow navigation
  useEffect(() => {
    if (!shouldFocusCellRef.current) return;
    shouldFocusCellRef.current = false;
    const el = document.querySelector<HTMLButtonElement>(
      `[data-date="${focusedDate}"]`,
    );
    el?.focus({ preventScroll: true });
  }, [focusedDate]);

  const isInRange = useCallback(
    (dateISO: string): boolean => {
      if (!selectedStart || !selectedEnd) return false;
      return dateISO > selectedStart && dateISO < selectedEnd;
    },
    [selectedStart, selectedEnd],
  );

  // Departure dates that satisfy booking rules for the current selectedStart
  const validDepartures = useMemo<Set<string>>(() => {
    if (!selectedStart || selectedEnd !== null) return new Set();
    const valid = new Set<string>();
    for (const date of allDates) {
      if (date > selectedStart && isValidBookingPeriod(selectedStart, date)) {
        valid.add(date);
      }
    }
    return valid;
  }, [selectedStart, selectedEnd, allDates]);

  // Returns true when a date cannot be selected due to seasonal booking rules
  const isRuleDisabled = useCallback(
    (dateISO: string): boolean => {
      if (selectedStart && !selectedEnd) {
        // Departure selection: only rule-valid departures after start are allowed
        if (dateISO > selectedStart) return !validDepartures.has(dateISO);
        // Before/at start: still clickable to reset
        return false;
      }
      // Arrival selection: July/August requires Saturday
      return isHighSeasonNonSaturday(dateISO);
    },
    [selectedStart, selectedEnd, validDepartures],
  );

  const handleSelect = useCallback(
    (dateISO: string) => {
      if (isRuleDisabled(dateISO)) return;

      let newStart = selectedStart;
      let newEnd = selectedEnd;

      if (!selectedStart || (selectedStart && selectedEnd)) {
        newStart = dateISO;
        newEnd = null;
      } else if (dateISO > selectedStart) {
        newEnd = dateISO;
      } else {
        newStart = dateISO;
        newEnd = null;
      }

      setSelectedStart(newStart);
      setSelectedEnd(newEnd);
      onSelectionChange?.(newStart, newEnd);
    },
    [selectedStart, selectedEnd, onSelectionChange, isRuleDisabled],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, dateISO: string) => {
      const idx = allDates.indexOf(dateISO);
      if (idx === -1) return;
      let newDate: string | undefined;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          newDate = allDates[Math.min(idx + 1, allDates.length - 1)];
          break;
        case "ArrowLeft":
          e.preventDefault();
          newDate = allDates[Math.max(idx - 1, 0)];
          break;
        case "ArrowDown":
          e.preventDefault();
          newDate = allDates[Math.min(idx + 7, allDates.length - 1)];
          break;
        case "ArrowUp":
          e.preventDefault();
          newDate = allDates[Math.max(idx - 7, 0)];
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleSelect(dateISO);
          return;
        default:
          return;
      }

      if (newDate && newDate !== dateISO) {
        shouldFocusCellRef.current = true;
        setFocusedDate(newDate);
      }
    },
    [allDates, handleSelect],
  );

  // True when the selected range contains at least one unavailable date
  const hasConflict = useMemo(() => {
    if (!selectedStart || !selectedEnd) return false;
    for (const date of allDates) {
      if (date >= selectedStart && date < selectedEnd && dayMap[date] === "unavailable") {
        return true;
      }
    }
    return false;
  }, [selectedStart, selectedEnd, allDates, dayMap]);

  // Nearest valid alternatives before and after the conflicting selection
  const alternatives = useMemo<{ before: Alternative | null; after: Alternative | null }>(() => {
    if (!selectedStart || !selectedEnd || !hasConflict) {
      return { before: null, after: null };
    }
    const nights = Math.round((toUTCMs(selectedEnd) - toUTCMs(selectedStart)) / MS_PER_DAY);
    if (nights <= 0) return { before: null, after: null };
    return {
      before: findAlternative(selectedStart, nights, dayMap, today, "before"),
      after: findAlternative(selectedEnd, nights, dayMap, today, "after"),
    };
  }, [selectedStart, selectedEnd, hasConflict, dayMap, today]);

  const suggestionStarts = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    if (alternatives.before) s.add(alternatives.before.start);
    if (alternatives.after) s.add(alternatives.after.start);
    return s;
  }, [alternatives]);

  const isAtMinMonth =
    firstMonth.year === todayYear && firstMonth.month === todayMonth;

  const handlePrevMonth = () => {
    if (isAtMinMonth) return;
    const newFirst = addMonths(firstMonth.year, firstMonth.month, -1);
    setFirstMonth(newFirst);
    setFocusedDate(toISO(newFirst.year, newFirst.month, 1));
  };

  const handleNextMonth = () => {
    const newFirst = addMonths(firstMonth.year, firstMonth.month, 1);
    setFirstMonth(newFirst);
    setFocusedDate(toISO(newFirst.year, newFirst.month, 1));
  };

  if (loading) return <CalendarSkeleton />;

  const gridProps = {
    dayMap,
    today,
    selectedStart,
    selectedEnd,
    focusedDate,
    isInRange,
    isRuleDisabled,
    suggestionStarts,
    onSelect: handleSelect,
    onKeyDown: handleKeyDown,
  };

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          disabled={isAtMinMonth}
          aria-label="Mois précédent"
          className={cn(
            "rounded-md p-2 transition-colors hover:bg-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isAtMinMonth && "cursor-not-allowed opacity-30",
          )}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Visible only on mobile — desktop shows 2 month headers in the grids */}
        <span className="text-sm font-medium text-muted-foreground lg:hidden">
          {MONTH_NAMES[firstMonth.month - 1]} {firstMonth.year}
        </span>

        <button
          onClick={handleNextMonth}
          aria-label="Mois suivant"
          className={cn(
            "rounded-md p-2 transition-colors hover:bg-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          )}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"
        role="list"
        aria-label="Légende du calendrier"
      >
        <span role="listitem" className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-card ring-1 ring-border">
            <span className="h-1 w-1 rounded-full bg-success" aria-hidden="true" />
          </span>
          Disponible
        </span>
        <span role="listitem" className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-unavailable/70" aria-hidden="true" />
          Indisponible
        </span>
        <span role="listitem" className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-amber-100" aria-hidden="true" />
          Option en cours
        </span>
        <span role="listitem" className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded bg-primary" aria-hidden="true" />
          Sélectionné
        </span>
      </div>

      {/* Calendar grids: 1 month on mobile, 2 months on desktop (≥ 1024px) */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {months.map(({ year, month }, i) => (
          <div key={`${year}-${month}`} className={i === 1 ? "hidden lg:block" : ""}>
            <MonthGrid
              year={year}
              month={month}
              {...gridProps}
            />
          </div>
        ))}
      </div>

      {/* Selection feedback & conflict suggestions */}
      <div aria-live="polite" aria-atomic="true" className="min-h-10">
        {selectedStart && selectedEnd && hasConflict ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">
              Cette période n&apos;est pas disponible.
            </p>
            {(alternatives.before ?? alternatives.after) && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Prochaines disponibilités :
                </p>
                <div className="flex flex-wrap gap-2">
                  {([alternatives.before, alternatives.after] as (Alternative | null)[])
                    .filter((alt): alt is Alternative => alt !== null)
                    .map((alt) => (
                      <button
                        key={alt.start}
                        onClick={() => {
                          const altYear = parseInt(alt.start.slice(0, 4), 10);
                          const altMonth = parseInt(alt.start.slice(5, 7), 10);
                          setFirstMonth({ year: altYear, month: altMonth });
                          setSelectedStart(alt.start);
                          setSelectedEnd(alt.end);
                          setFocusedDate(alt.start);
                          onSelectionChange?.(alt.start, alt.end);
                        }}
                        className={cn(
                          "rounded-md border border-primary/40 px-3 py-1.5 text-xs text-primary-text",
                          "hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        )}
                      >
                        Semaine du {formatDateLabel(alt.start)}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : selectedStart ? (
          <p className="text-sm text-muted-foreground">
            {selectedEnd
              ? `Arrivée : ${formatDateLabel(selectedStart)} — Départ : ${formatDateLabel(selectedEnd)}`
              : `Arrivée : ${formatDateLabel(selectedStart)} — Sélectionnez votre date de départ`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
