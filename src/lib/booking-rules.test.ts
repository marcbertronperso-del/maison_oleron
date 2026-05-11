import { describe, it, expect } from "vitest";
import {
  isValidBookingPeriod,
  getDiscountRate,
  getAvailableStartDates,
  getPricePerNight,
} from "~/lib/booking-rules";

// 2025 calendar reference (verified Saturdays):
// Jan: 04, 11, 18, 25  (Jan 1 = Wed)
// Jun: 07, 14, 21, 28  (28 days before Jul 05)
// Jul: 05, 12, 19, 26
// Aug: 02, 09, 16, 23, 30
// Sep: 06, 13, 20, 27

describe("isValidBookingPeriod — high season (July / August)", () => {
  it("Sat→Sat 7 nights in July is valid", () => {
    expect(isValidBookingPeriod("2025-07-05", "2025-07-12")).toBe(true);
  });

  it("Sat→Sat 14 nights in July is valid", () => {
    expect(isValidBookingPeriod("2025-07-05", "2025-07-19")).toBe(true);
  });

  it("last week of July: Sat Jul 19→Sat Jul 26 is valid", () => {
    expect(isValidBookingPeriod("2025-07-19", "2025-07-26")).toBe(true);
  });

  it("first week of August: Sat Aug 02→Sat Aug 09 is valid", () => {
    expect(isValidBookingPeriod("2025-08-02", "2025-08-09")).toBe(true);
  });

  it("cross-month: Sat Jul 26→Sat Aug 02 (7 nights) is valid", () => {
    expect(isValidBookingPeriod("2025-07-26", "2025-08-02")).toBe(true);
  });

  it("cross-month: Sat Jul 26→Sat Aug 09 (14 nights) is valid", () => {
    expect(isValidBookingPeriod("2025-07-26", "2025-08-09")).toBe(true);
  });

  it("Sat→Sat 7 nights in August is valid", () => {
    expect(isValidBookingPeriod("2025-08-09", "2025-08-16")).toBe(true);
  });

  it("arrival not Saturday is invalid (Sun→Sun)", () => {
    expect(isValidBookingPeriod("2025-07-06", "2025-07-13")).toBe(false);
  });

  it("departure not Saturday is invalid (Sat→Sun 8 nights)", () => {
    expect(isValidBookingPeriod("2025-07-05", "2025-07-13")).toBe(false);
  });

  it("same-day high season is invalid", () => {
    expect(isValidBookingPeriod("2025-07-05", "2025-07-05")).toBe(false);
  });
});

describe("isValidBookingPeriod — off-season", () => {
  // Jan 2025: Sat=04, Sun=05, Mon=06 | Fri=03, Thu=02, Tue=07

  it("Sat→Mon 2 nights (Sat night + Sun night) is valid", () => {
    expect(isValidBookingPeriod("2025-01-04", "2025-01-06")).toBe(true);
  });

  it("Fri→Sun 2 nights (Fri+Sat only, no Sunday night) is invalid", () => {
    expect(isValidBookingPeriod("2025-01-03", "2025-01-05")).toBe(false);
  });

  it("Sun→Tue 2 nights (Sun+Mon only, no Saturday night) is invalid", () => {
    expect(isValidBookingPeriod("2025-01-05", "2025-01-07")).toBe(false);
  });

  it("Fri→Mon 3 nights (Fri+Sat+Sun, includes complete weekend) is valid", () => {
    expect(isValidBookingPeriod("2025-01-03", "2025-01-06")).toBe(true);
  });

  it("Thu→Sun 3 nights (Thu+Fri+Sat, no Sunday night) is invalid", () => {
    expect(isValidBookingPeriod("2025-01-02", "2025-01-05")).toBe(false);
  });

  it("Thu→Mon 4 nights (includes Sat+Sun) is valid", () => {
    expect(isValidBookingPeriod("2025-01-02", "2025-01-06")).toBe(true);
  });

  it("Sat→Sun 1 night is invalid (less than 2 nights)", () => {
    expect(isValidBookingPeriod("2025-01-04", "2025-01-05")).toBe(false);
  });

  it("same-day off-season is invalid", () => {
    expect(isValidBookingPeriod("2025-03-15", "2025-03-15")).toBe(false);
  });

  it("departure before arrival is invalid", () => {
    expect(isValidBookingPeriod("2025-03-15", "2025-03-10")).toBe(false);
  });

  it("June Sat→Mon 2 nights is valid (off-season rules apply)", () => {
    expect(isValidBookingPeriod("2025-06-07", "2025-06-09")).toBe(true);
  });
});

describe("getDiscountRate", () => {
  it("14 nights in July → 0.15", () => {
    expect(getDiscountRate("2025-07-05", "2025-07-19")).toBe(0.15);
  });

  it("14 nights in August → 0.15", () => {
    expect(getDiscountRate("2025-08-02", "2025-08-16")).toBe(0.15);
  });

  it("14 nights cross-month Jul→Aug → 0.15", () => {
    expect(getDiscountRate("2025-07-26", "2025-08-09")).toBe(0.15);
  });

  it("21 nights in July → 0.15 (>= 14 qualifies)", () => {
    expect(getDiscountRate("2025-07-05", "2025-07-26")).toBe(0.15);
  });

  it("7 nights in July → 0 (< 14 nights)", () => {
    expect(getDiscountRate("2025-07-05", "2025-07-12")).toBe(0);
  });

  it("14 nights in June → 0 (not high season)", () => {
    expect(getDiscountRate("2025-06-07", "2025-06-21")).toBe(0);
  });

  it("14 nights in September → 0 (not high season)", () => {
    expect(getDiscountRate("2025-09-06", "2025-09-20")).toBe(0);
  });
});

describe("getAvailableStartDates", () => {
  it("July → saturday-only", () => {
    expect(getAvailableStartDates(7)).toBe("saturday-only");
  });

  it("August → saturday-only", () => {
    expect(getAvailableStartDates(8)).toBe("saturday-only");
  });

  it("June → any-day", () => {
    expect(getAvailableStartDates(6)).toBe("any-day");
  });

  it("September → any-day", () => {
    expect(getAvailableStartDates(9)).toBe("any-day");
  });

  it("January → any-day", () => {
    expect(getAvailableStartDates(1)).toBe("any-day");
  });

  it("December → any-day", () => {
    expect(getAvailableStartDates(12)).toBe("any-day");
  });
});

describe("getPricePerNight", () => {
  it("August → 200 EUR", () => {
    expect(getPricePerNight("2025-08-02")).toBe(200);
  });

  it("July → 150 EUR", () => {
    expect(getPricePerNight("2025-07-05")).toBe(150);
  });

  it("June → 100 EUR", () => {
    expect(getPricePerNight("2025-06-07")).toBe(100);
  });

  it("May → 80 EUR (off-season)", () => {
    expect(getPricePerNight("2025-05-10")).toBe(80);
  });

  it("September → 80 EUR (off-season)", () => {
    expect(getPricePerNight("2025-09-06")).toBe(80);
  });

  it("December → 80 EUR (off-season)", () => {
    expect(getPricePerNight("2025-12-20")).toBe(80);
  });

  it("January → 80 EUR (off-season)", () => {
    expect(getPricePerNight("2025-01-15")).toBe(80);
  });
});
