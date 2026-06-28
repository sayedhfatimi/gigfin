// Pure expense aggregations in integer minor units over ISO-dated rows.
// Reimplemented from gigfin-old/lib/expenses.ts (which read the `paidAt` field;
// v2 uses `date`).

import { distribution, monthlyTotals } from "./aggregate";

export type ExpenseRow = {
  expenseType: string;
  amountMinor: number;
  date: string;
};

export function sumExpenseMinor(rows: readonly ExpenseRow[]): number {
  return rows.reduce((acc, r) => acc + r.amountMinor, 0);
}

export type CategorySlice = {
  expenseType: string;
  amountMinor: number;
  pct: number; // 0..1 share of the total
};

// Per-category totals, sorted high → low, each with its share of the total.
export function categoryDistribution(
  rows: readonly ExpenseRow[],
): CategorySlice[] {
  return distribution(
    rows,
    (r) => r.expenseType,
    (r) => r.amountMinor,
  ).map(({ key, amountMinor, pct }) => ({
    expenseType: key,
    amountMinor,
    pct,
  }));
}

// 12-element array (Jan..Dec) of expense totals for the given calendar year.
export function monthlyExpenseMinor(
  rows: readonly ExpenseRow[],
  year: number,
): number[] {
  return monthlyTotals(
    rows,
    year,
    (r) => r.amountMinor,
    (r) => r.date,
  );
}
