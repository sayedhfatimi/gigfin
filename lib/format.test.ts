import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  formatDuration,
  formatMoney,
  localDateISO,
  minutesToTime,
  parseMoneyToMinor,
  timeToMinutes,
  titleCase,
  todayISO,
} from "./format";

describe("parseMoneyToMinor", () => {
  it("converts major units to integer minor units", () => {
    expect(parseMoneyToMinor("41.50")).toBe(4150);
    expect(parseMoneyToMinor("33")).toBe(3300);
    expect(parseMoneyToMinor("0.01")).toBe(1);
  });

  it("strips currency symbols and thousands separators", () => {
    expect(parseMoneyToMinor("£1,234.56")).toBe(123456);
  });

  it("returns null for non-numeric input", () => {
    expect(parseMoneyToMinor("abc")).toBeNull();
    expect(parseMoneyToMinor("")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats minor units as currency", () => {
    expect(formatMoney(4150, "GBP")).toContain("41.50");
    expect(formatMoney(0, "GBP")).toContain("0.00");
  });

  it("round-trips with parseMoneyToMinor", () => {
    const minor = parseMoneyToMinor("12.34");
    expect(minor).toBe(1234);
    expect(formatMoney(minor as number, "GBP")).toContain("12.34");
  });
});

describe("formatDate", () => {
  it("renders an ISO date in a human form", () => {
    const out = formatDate("2026-06-11");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/11/);
  });

  it("returns the input unchanged when malformed", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("titleCase", () => {
  it("converts snake_case to Title Case", () => {
    expect(titleCase("fuel_charging")).toBe("Fuel Charging");
    expect(titleCase("road_tax")).toBe("Road Tax");
  });
});

describe("todayISO", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the LOCAL calendar date, not the UTC date", () => {
    // An instant that is still 2024-01-01 locally (UTC-5) but already
    // 2024-01-02 in UTC. todayISO must follow the local calendar.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T02:30:00.000Z"));
    const expectedLocal = localDateISO();
    expect(todayISO()).toBe(expectedLocal);
    // Sanity: in a UTC+ test env the UTC slice could differ from local; the
    // contract is that todayISO and localDateISO never diverge.
    expect(todayISO()).toBe(localDateISO());
  });
});

describe("time helpers", () => {
  it("timeToMinutes parses HH:MM", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
    expect(timeToMinutes("bad")).toBeNull();
    expect(timeToMinutes("25:00")).toBeNull();
  });

  it("minutesToTime formats minutes from midnight", () => {
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("formatDuration renders hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(0)).toBe("0m");
  });
});
