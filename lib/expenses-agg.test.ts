import { describe, expect, it } from "vitest";
import {
  categoryDistribution,
  type ExpenseRow,
  monthlyExpenseMinor,
  sumExpenseMinor,
} from "./expenses-agg";

const rows: ExpenseRow[] = [
  { expenseType: "fuel_charging", amountMinor: 5000, date: "2026-06-01" },
  { expenseType: "insurance", amountMinor: 3000, date: "2026-06-03" },
  { expenseType: "fuel_charging", amountMinor: 2000, date: "2026-05-20" },
];

describe("sumExpenseMinor", () => {
  it("sums minor units", () => {
    expect(sumExpenseMinor(rows)).toBe(10000);
    expect(sumExpenseMinor([])).toBe(0);
  });
});

describe("categoryDistribution", () => {
  it("aggregates per category, sorted high to low, with shares", () => {
    const dist = categoryDistribution(rows);
    expect(dist).toHaveLength(2);
    expect(dist[0]).toMatchObject({
      expenseType: "fuel_charging",
      amountMinor: 7000,
    });
    expect(dist[1]).toMatchObject({
      expenseType: "insurance",
      amountMinor: 3000,
    });
    expect(dist.reduce((a, d) => a + d.pct, 0)).toBeCloseTo(1);
  });
});

describe("monthlyExpenseMinor", () => {
  it("buckets a calendar year into 12 months", () => {
    const buckets = monthlyExpenseMinor(rows, 2026);
    expect(buckets[4]).toBe(2000); // May
    expect(buckets[5]).toBe(8000); // June
  });
});
