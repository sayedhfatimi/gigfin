// Pure expense aggregations in integer minor units over ISO-dated rows.
// Reimplemented from gigfin-old/lib/expenses.ts (which read the `paidAt` field;
// v2 uses `date`).

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
  const byType = new Map<string, number>();
  for (const r of rows) {
    byType.set(r.expenseType, (byType.get(r.expenseType) ?? 0) + r.amountMinor);
  }
  const total = sumExpenseMinor(rows);
  return [...byType.entries()]
    .map(([expenseType, amountMinor]) => ({
      expenseType,
      amountMinor,
      pct: total ? amountMinor / total : 0,
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor);
}

// 12-element array (Jan..Dec) of expense totals for the given calendar year.
export function monthlyExpenseMinor(
  rows: readonly ExpenseRow[],
  year: number,
): number[] {
  const buckets = new Array<number>(12).fill(0);
  const prefix = `${year}-`;
  for (const r of rows) {
    if (!r.date.startsWith(prefix)) continue;
    const month = Number(r.date.slice(5, 7)) - 1;
    if (month >= 0 && month < 12) buckets[month] += r.amountMinor;
  }
  return buckets;
}
