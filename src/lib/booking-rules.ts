import { MS_PER_DAY, toUTCMs, utcDow, monthOf } from "~/lib/date-utils";

function isHighSeason(dateStr: string): boolean {
  const m = monthOf(dateStr);
  return m === 7 || m === 8;
}

/**
 * July/August: arrival AND departure must be Saturday, minimum 7 nights.
 * Other months: minimum 2 nights AND at least one complete weekend
 * (Saturday night + Sunday night both within the stay).
 *
 * A night `d` is "within the stay" when arrival ≤ d < departure.
 * Algorithm: find the first Saturday on or after arrival, then verify that
 * the following Sunday is strictly before departure.
 */
export function isValidBookingPeriod(arrival: string, departure: string): boolean {
  const arrivalMs = toUTCMs(arrival);
  const departureMs = toUTCMs(departure);
  const nights = Math.round((departureMs - arrivalMs) / MS_PER_DAY);
  if (nights <= 0) return false;

  const arrivalDow = utcDow(arrivalMs);
  const departureDow = utcDow(departureMs);

  if (isHighSeason(arrival)) {
    return arrivalDow === 6 && departureDow === 6 && nights >= 7;
  }

  if (nights < 2) return false;
  const daysToSat = (6 - arrivalDow + 7) % 7;
  const satMs = arrivalMs + daysToSat * MS_PER_DAY;
  const sunMs = satMs + MS_PER_DAY;
  return sunMs < departureMs;
}

/**
 * Returns 0.15 (15 % off) for stays of 2+ consecutive weeks arriving in
 * July or August; 0 otherwise.
 */
export function getDiscountRate(arrival: string, departure: string): number {
  if (!isHighSeason(arrival)) return 0;
  const nights = Math.round((toUTCMs(departure) - toUTCMs(arrival)) / MS_PER_DAY);
  return nights >= 14 ? 0.15 : 0;
}

export type StartDateRule = "saturday-only" | "any-day";

/**
 * In July and August only Saturdays are valid arrival dates.
 * All other months any day is valid (subject to isValidBookingPeriod).
 */
export function getAvailableStartDates(month: number): StartDateRule {
  return month === 7 || month === 8 ? "saturday-only" : "any-day";
}

/**
 * Price per night in EUR based on arrival month.
 * August: 200 | July: 150 | June: 100 | other months: 80
 */
export function getPricePerNight(date: string): number {
  const m = monthOf(date);
  if (m === 8) return 200;
  if (m === 7) return 150;
  if (m === 6) return 100;
  return 80;
}
