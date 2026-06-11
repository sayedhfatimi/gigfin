import { describe, expect, it } from "vitest";
import {
  type IncomeRow,
  monthlyIncomeMinor,
  platformConcentration,
  platformDistribution,
  sumIncomeMinor,
} from "./income";

const rows: IncomeRow[] = [
  { platform: "Uber Eats", amountMinor: 6000, date: "2026-06-01" },
  { platform: "Deliveroo", amountMinor: 4000, date: "2026-06-02" },
  { platform: "Uber Eats", amountMinor: 2000, date: "2026-05-15" },
];

describe("sumIncomeMinor", () => {
  it("sums minor units", () => {
    expect(sumIncomeMinor(rows)).toBe(12000);
    expect(sumIncomeMinor([])).toBe(0);
  });
});

describe("platformDistribution", () => {
  it("aggregates per platform, sorted high to low, with shares", () => {
    const dist = platformDistribution(rows);
    expect(dist).toHaveLength(2);
    expect(dist[0]).toMatchObject({ platform: "Uber Eats", amountMinor: 8000 });
    expect(dist[1]).toMatchObject({ platform: "Deliveroo", amountMinor: 4000 });
    expect(dist[0].pct).toBeCloseTo(8000 / 12000);
    expect(dist.reduce((a, d) => a + d.pct, 0)).toBeCloseTo(1);
  });

  it("is empty for no rows", () => {
    expect(platformDistribution([])).toEqual([]);
  });
});

describe("platformConcentration", () => {
  it("returns the largest single-platform share", () => {
    expect(platformConcentration(rows)).toBeCloseTo(8000 / 12000);
    expect(platformConcentration([])).toBe(0);
  });
});

describe("monthlyIncomeMinor", () => {
  it("buckets a calendar year into 12 months", () => {
    const buckets = monthlyIncomeMinor(rows, 2026);
    expect(buckets).toHaveLength(12);
    expect(buckets[4]).toBe(2000); // May
    expect(buckets[5]).toBe(10000); // June
    expect(buckets[0]).toBe(0); // Jan
  });

  it("ignores other years", () => {
    expect(monthlyIncomeMinor(rows, 2025).every((b) => b === 0)).toBe(true);
  });
});
