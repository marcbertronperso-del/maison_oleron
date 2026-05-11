/**
 * Returns the number of nights between two ISO date strings (YYYY-MM-DD).
 * Uses UTC midnight to avoid DST shifts.
 */
export function countNights(arrival: string, departure: string): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const parse = (s: string) =>
    Date.UTC(
      parseInt(s.slice(0, 4), 10),
      parseInt(s.slice(5, 7), 10) - 1,
      parseInt(s.slice(8, 10), 10),
    );
  const a = parse(arrival);
  const d = parse(departure);
  if (isNaN(a) || isNaN(d)) throw new Error(`Invalid date: "${arrival}" or "${departure}"`);
  const nights = Math.round((d - a) / MS_PER_DAY);
  if (nights <= 0) throw new Error(`departure must be after arrival (got ${nights} nights)`);
  return nights;
}
