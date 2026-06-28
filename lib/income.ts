// Pure income aggregations in integer minor units over ISO-dated rows.
// Reimplemented from gigfin-old/lib/income.ts (which worked in float pounds).

import { distribution, monthlyTotals } from "./aggregate";

export type IncomeRow = { platform: string; amountMinor: number; date: string };

export function sumIncomeMinor(rows: readonly IncomeRow[]): number {
  return rows.reduce((acc, r) => acc + r.amountMinor, 0);
}

export type PlatformSlice = {
  platform: string;
  amountMinor: number;
  pct: number; // 0..1 share of the total
};

// Per-platform totals, sorted high → low, each with its share of the total.
export function platformDistribution(
  rows: readonly IncomeRow[],
): PlatformSlice[] {
  return distribution(
    rows,
    (r) => r.platform,
    (r) => r.amountMinor,
  ).map(({ key, amountMinor, pct }) => ({ platform: key, amountMinor, pct }));
}

// Largest single-platform share (0..1) — the "platform concentration" risk metric.
export function platformConcentration(rows: readonly IncomeRow[]): number {
  return platformDistribution(rows)[0]?.pct ?? 0;
}

// 12-element array (Jan..Dec) of income totals for the given calendar year.
export function monthlyIncomeMinor(
  rows: readonly IncomeRow[],
  year: number,
): number[] {
  return monthlyTotals(
    rows,
    year,
    (r) => r.amountMinor,
    (r) => r.date,
  );
}
