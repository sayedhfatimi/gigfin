"use client";

import { formatMoney } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

const sumInYear = <T extends { date: string }>(
  rows: readonly T[],
  year: number,
  pick: (r: T) => number,
) =>
  rows.reduce(
    (acc, r) => (r.date.startsWith(`${year}-`) ? acc + pick(r) : acc),
    0,
  );

// Annualised net, extrapolated from year-to-date. Fixed (annual).
export function YearlyRunRateWidget({ data }: WidgetProps) {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1).getTime();
  const elapsedDays = Math.max(
    1,
    Math.floor((now.getTime() - startOfYear) / 86_400_000) + 1,
  );
  const fraction = elapsedDays / 365;

  const incomeMinor = sumInYear(data.income, year, (r) => r.amountMinor);
  const expenseMinor = sumInYear(data.expenses, year, (r) => r.amountMinor);
  const ytdNet = incomeMinor - expenseMinor;
  const projected = Math.round(ytdNet / fraction);

  return (
    <WidgetCard
      title="Yearly run-rate"
      caption={`Projected from ${year} so far`}
    >
      <p className="font-semibold text-3xl tabular-nums">
        {formatMoney(projected, data.currency)}
      </p>
      <p className="mt-1 text-muted-foreground text-sm tabular-nums">
        {formatMoney(ytdNet, data.currency)} net in {elapsedDays} days
      </p>
    </WidgetCard>
  );
}
