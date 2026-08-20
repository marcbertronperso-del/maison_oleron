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
 * No long-stay discount currently applies (removed for both July and August).
 */
export function getDiscountRate(_arrival: string, _departure: string): number {
  return 0;
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
 * Price per night in EUR based on the night's own month.
 * August: 230 | July: 220 | June: 100 | other months: 80
 */
export function getPricePerNight(date: string): number {
  const m = monthOf(date);
  if (m === 8) return 230;
  if (m === 7) return 220;
  if (m === 6) return 100;
  return 80;
}

/**
 * Total stay price in EUR: sums each individual night's price rather than
 * multiplying nights by the arrival night's rate, so cross-month stays
 * (e.g. arriving in July, departing in August) are priced correctly.
 */
export function getStaySubtotal(arrival: string, departure: string): number {
  const arrivalMs = toUTCMs(arrival);
  const departureMs = toUTCMs(departure);
  let total = 0;
  for (let ms = arrivalMs; ms < departureMs; ms += MS_PER_DAY) {
    const d = new Date(ms);
    const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    total += getPricePerNight(iso);
  }
  return total;
}
