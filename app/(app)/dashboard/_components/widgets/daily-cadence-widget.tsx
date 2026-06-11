"use client";

import { addDaysISO } from "@/lib/dates";
import { formatMoney, todayISO } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

const DAYS = 84; // 12 weeks

// GitHub-style heatmap of daily income for the last 12 weeks. Fixed window.
export function DailyCadenceWidget({ data }: WidgetProps) {
  const today = todayISO();
  const byDate = new Map<string, number>();
  for (const r of data.income) {
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.amountMinor);
  }

  const cells = Array.from({ length: DAYS }, (_, i) => {
    const date = addDaysISO(today, -(DAYS - 1 - i));
    return { date, amount: byDate.get(date) ?? 0 };
  });
  const max = Math.max(1, ...cells.map((c) => c.amount));
  const levels = [
    "bg-muted",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/70",
    "bg-primary",
  ];
  const levelOf = (amount: number) =>
    amount === 0 ? 0 : Math.min(4, Math.ceil((amount / max) * 4));

  return (
    <WidgetCard title="Daily cadence" caption="Income · last 12 weeks">
      <div
        className="grid grid-flow-col grid-rows-7 gap-1"
        style={{ gridAutoColumns: "minmax(0, 1fr)" }}
      >
        {cells.map((c) => (
          <div
            key={c.date}
            title={`${c.date}: ${formatMoney(c.amount, data.currency)}`}
            className={`aspect-square rounded-sm ${levels[levelOf(c.amount)]}`}
          />
        ))}
      </div>
    </WidgetCard>
  );
}
