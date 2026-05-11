export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Parse ISO 8601 date string (YYYY-MM-DD) to UTC milliseconds. */
export function toUTCMs(dateStr: string): number {
  return Date.UTC(
    parseInt(dateStr.slice(0, 4), 10),
    parseInt(dateStr.slice(5, 7), 10) - 1,
    parseInt(dateStr.slice(8, 10), 10),
  );
}

/** Day of week from UTC ms: 0=Sunday … 6=Saturday. */
export function utcDow(ms: number): number {
  return new Date(ms).getUTCDay();
}

/** Extract month (1–12) from ISO date string. */
export function monthOf(dateStr: string): number {
  return parseInt(dateStr.slice(5, 7), 10);
}
