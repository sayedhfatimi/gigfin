// Pure income aggregations in integer minor units over ISO-dated rows.
// Reimplemented from gigfin-old/lib/income.ts (which worked in float pounds).

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
  const byPlatform = new Map<string, number>();
  for (const r of rows) {
    byPlatform.set(
      r.platform,
      (byPlatform.get(r.platform) ?? 0) + r.amountMinor,
    );
  }
  const total = sumIncomeMinor(rows);
  return [...byPlatform.entries()]
    .map(([platform, amountMinor]) => ({
      platform,
      amountMinor,
      pct: total ? amountMinor / total : 0,
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor);
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
  const buckets = new Array<number>(12).fill(0);
  const prefix = `${year}-`;
  for (const r of rows) {
    if (!r.date.startsWith(prefix)) continue;
    const month = Number(r.date.slice(5, 7)) - 1;
    if (month >= 0 && month < 12) buckets[month] += r.amountMinor;
  }
  return buckets;
}
