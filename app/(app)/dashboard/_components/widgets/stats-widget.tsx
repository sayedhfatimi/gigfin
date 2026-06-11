"use client";

import { timeframeLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Headline KPIs for the active timeframe. Pinned.
export function StatsWidget({ data }: WidgetProps) {
  const { currency } = data;
  const { incomeMinor, expenseMinor, netMinor, workedMinutes } = data.scoped;
  const hours = workedMinutes / 60;
  const perHour = hours > 0 ? Math.round(incomeMinor / hours) : null;

  const items = [
    { label: "Income", value: formatMoney(incomeMinor, currency) },
    { label: "Expenses", value: formatMoney(expenseMinor, currency) },
    { label: "Net", value: formatMoney(netMinor, currency) },
    {
      label: "Per hour",
      value: perHour === null ? "—" : `${formatMoney(perHour, currency)}/h`,
    },
  ];

  return (
    <WidgetCard title="Summary" caption={timeframeLabel(data.timeframe)}>
      <div className="grid grid-cols-2 gap-4">
        {items.map((i) => (
          <div key={i.label} className="space-y-0.5">
            <p className="text-muted-foreground text-xs">{i.label}</p>
            <p className="font-semibold text-xl tabular-nums">{i.value}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
