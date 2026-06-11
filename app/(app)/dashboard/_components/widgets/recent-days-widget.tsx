"use client";

import { addDaysISO } from "@/lib/dates";
import { formatMoney, todayISO } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

const sumOn = (
  rows: readonly { date: string; amountMinor: number }[],
  date: string,
) => rows.reduce((acc, r) => (r.date === date ? acc + r.amountMinor : acc), 0);

// Net per day for the last 7 days. Fixed (recent window).
export function RecentDaysWidget({ data }: WidgetProps) {
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(today, -(6 - i));
    const net = sumOn(data.income, date) - sumOn(data.expenses, date);
    const label = WEEKDAY.format(new Date(`${date}T00:00:00`));
    return { date, label, net };
  }).reverse();

  return (
    <WidgetCard title="Recent days" caption="Net, last 7 days">
      <div className="space-y-1.5">
        {days.map((d) => (
          <div
            key={d.date}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{d.label}</span>
            <span className="tabular-nums">
              {formatMoney(d.net, data.currency)}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
