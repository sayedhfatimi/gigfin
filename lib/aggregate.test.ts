import { describe, expect, it } from "vitest";
import { distribution, monthlyTotals } from "./aggregate";

type Row = { k: string; amountMinor: number; date: string };

describe("distribution", () => {
  it("returns an empty array for no rows", () => {
    expect(
      distribution(
        [] as Row[],
        (r) => r.k,
        (r) => r.amountMinor,
      ),
    ).toEqual([]);
  });

  it("sums a single group with full share", () => {
    const rows: Row[] = [
      { k: "a", amountMinor: 100, date: "2025-01-01" },
      { k: "a", amountMinor: 50, date: "2025-01-02" },
    ];
    expect(
      distribution(
        rows,
        (r) => r.k,
        (r) => r.amountMinor,
      ),
    ).toEqual([{ key: "a", amountMinor: 150, pct: 1 }]);
  });

  it("groups, sorts high → low, and computes shares", () => {
    const rows: Row[] = [
      { k: "a", amountMinor: 100, date: "2025-01-01" },
      { k: "b", amountMinor: 300, date: "2025-01-01" },
    ];
    const out = distribution(
      rows,
      (r) => r.k,
      (r) => r.amountMinor,
    );
    expect(out).toEqual([
      { key: "b", amountMinor: 300, pct: 0.75 },
      { key: "a", amountMinor: 100, pct: 0.25 },
    ]);
  });

  it("yields pct 0 when the total is zero", () => {
    const rows: Row[] = [{ k: "a", amountMinor: 0, date: "2025-01-01" }];
    expect(
      distribution(
        rows,
        (r) => r.k,
        (r) => r.amountMinor,
      ),
    ).toEqual([{ key: "a", amountMinor: 0, pct: 0 }]);
  });
});

describe("monthlyTotals", () => {
  it("buckets by month for the requested year only", () => {
    const rows: Row[] = [
      { k: "a", amountMinor: 100, date: "2025-01-15" },
      { k: "a", amountMinor: 50, date: "2025-01-20" },
      { k: "a", amountMinor: 200, date: "2025-03-01" },
      { k: "a", amountMinor: 999, date: "2024-03-01" }, // different year, ignored
    ];
    const out = monthlyTotals(
      rows,
      2025,
      (r) => r.amountMinor,
      (r) => r.date,
    );
    expect(out).toHaveLength(12);
    expect(out[0]).toBe(150); // January
    expect(out[2]).toBe(200); // March
    expect(out.reduce((a, b) => a + b, 0)).toBe(350);
  });

  it("returns all zeros when nothing matches the year", () => {
    const rows: Row[] = [{ k: "a", amountMinor: 100, date: "2024-01-01" }];
    expect(
      monthlyTotals(
        rows,
        2025,
        (r) => r.amountMinor,
        (r) => r.date,
      ),
    ).toEqual(new Array(12).fill(0));
  });
});
