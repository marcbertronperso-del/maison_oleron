import { describe, it, expect } from "vitest";
import { countNights } from "~/lib/pricing";

describe("countNights", () => {
  it("returns 7 for a standard week stay", () => {
    expect(countNights("2025-07-05", "2025-07-12")).toBe(7);
  });

  it("returns 1 for adjacent days", () => {
    expect(countNights("2025-06-01", "2025-06-02")).toBe(1);
  });

  it("handles month boundary", () => {
    expect(countNights("2025-01-28", "2025-02-04")).toBe(7);
  });

  it("handles year boundary", () => {
    expect(countNights("2025-12-28", "2026-01-04")).toBe(7);
  });

  it("is immune to DST shift (spring forward)", () => {
    // Last Sunday of March in France: 2025-03-30
    expect(countNights("2025-03-29", "2025-04-05")).toBe(7);
  });

  it("throws on swapped dates (departure before arrival)", () => {
    expect(() => countNights("2025-07-12", "2025-07-05")).toThrow();
  });

  it("throws on same-day (0 nights)", () => {
    expect(() => countNights("2025-07-05", "2025-07-05")).toThrow();
  });

  it("throws on malformed date string", () => {
    expect(() => countNights("not-a-date", "2025-07-12")).toThrow();
  });
});
