"use client";

import { addDaysISO } from "@/lib/dates";
import { formatMoney, todayISO } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

const sumOn = (
  rows: readonly { date: string; amountMinor: number }[],
  date: string,
) => rows.reduce((acc, r) => (r.date === date ? acc + r.amountMinor : acc), 0);

// Today's net vs yesterday's. Fixed period — ignores the global timeframe. Pinned.
export function TodaySnapshotWidget({ data }: WidgetProps) {
  const { currency } = data;
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);

  const todayNet = sumOn(data.income, today) - sumOn(data.expenses, today);
  const yesterdayNet =
    sumOn(data.income, yesterday) - sumOn(data.expenses, yesterday);

  return (
    <WidgetCard title="Today" caption="Net so far, vs yesterday">
      <div className="flex items-end justify-between gap-4">
        <p className="font-semibold text-3xl tabular-nums">
          {formatMoney(todayNet, currency)}
        </p>
        <p className="text-muted-foreground text-sm tabular-nums">
          Yesterday {formatMoney(yesterdayNet, currency)}
        </p>
      </div>
    </WidgetCard>
  );
}
