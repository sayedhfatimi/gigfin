import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  getTimeframeRange,
  inRange,
  timeframeLabel,
} from "./dates";

// 2026-06-11 is a Thursday (Jan 1 2026 = Thursday).
const REF = "2026-06-11";

describe("getTimeframeRange", () => {
  it("today / yesterday", () => {
    expect(getTimeframeRange("today", REF)).toEqual({
      start: "2026-06-11",
      end: "2026-06-11",
    });
    expect(getTimeframeRange("yesterday", REF)).toEqual({
      start: "2026-06-10",
      end: "2026-06-10",
    });
  });

  it("weekly starts on Monday", () => {
    expect(getTimeframeRange("weekly", REF)).toEqual({
      start: "2026-06-08",
      end: "2026-06-11",
    });
  });

  it("monthly / yearToDate", () => {
    expect(getTimeframeRange("monthly", REF)).toEqual({
      start: "2026-06-01",
      end: "2026-06-11",
    });
    expect(getTimeframeRange("yearToDate", REF)).toEqual({
      start: "2026-01-01",
      end: "2026-06-11",
    });
  });

  it("last12Months rolls back a year", () => {
    expect(getTimeframeRange("last12Months", REF)).toEqual({
      start: "2025-06-11",
      end: "2026-06-11",
    });
  });

  it("all covers everything up to the reference", () => {
    expect(getTimeframeRange("all", REF)).toEqual({
      start: "0000-01-01",
      end: "2026-06-11",
    });
  });
});

describe("inRange", () => {
  it("is inclusive of both bounds", () => {
    const r = getTimeframeRange("monthly", REF);
    expect(inRange("2026-06-01", r)).toBe(true);
    expect(inRange("2026-06-11", r)).toBe(true);
    expect(inRange("2026-05-31", r)).toBe(false);
    expect(inRange("2026-06-12", r)).toBe(false);
  });
});

describe("addDaysISO", () => {
  it("crosses month boundaries", () => {
    expect(addDaysISO("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("timeframeLabel", () => {
  it("returns the option label", () => {
    expect(timeframeLabel("monthly")).toBe("This month");
    expect(timeframeLabel("all")).toBe("All time");
  });
});
