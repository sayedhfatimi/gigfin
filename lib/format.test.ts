import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatMoney,
  parseMoneyToMinor,
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
  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
