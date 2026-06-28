// Generic pure aggregations over integer-minor-unit rows. The income and expense
// aggregation helpers are thin wrappers around these so the group/sum/share and
// month-bucketing logic lives in exactly one place.

export type GroupSlice = {
  key: string;
  amountMinor: number;
  pct: number; // 0..1 share of the total
};

// Per-key totals, sorted high → low, each with its share of the grand total.
export function distribution<T>(
  rows: readonly T[],
  keyOf: (r: T) => string,
  amountOf: (r: T) => number,
): GroupSlice[] {
  const byKey = new Map<string, number>();
  let total = 0;
  for (const r of rows) {
    const amount = amountOf(r);
    byKey.set(keyOf(r), (byKey.get(keyOf(r)) ?? 0) + amount);
    total += amount;
  }
  return [...byKey.entries()]
    .map(([key, amountMinor]) => ({
      key,
      amountMinor,
      pct: total ? amountMinor / total : 0,
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor);
}

// 12-element array (Jan..Dec) of totals for the given calendar year.
export function monthlyTotals<T>(
  rows: readonly T[],
  year: number,
  amountOf: (r: T) => number,
  dateOf: (r: T) => string,
): number[] {
  const buckets = new Array<number>(12).fill(0);
  const prefix = `${year}-`;
  for (const r of rows) {
    const date = dateOf(r);
    if (!date.startsWith(prefix)) continue;
    const month = Number(date.slice(5, 7)) - 1;
    if (month >= 0 && month < 12) buckets[month] += amountOf(r);
  }
  return buckets;
}
