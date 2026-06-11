"use client";

import { timeframeLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Gross / expenses / net / margin for the active timeframe. Global.
export function ProfitabilityWidget({ data }: WidgetProps) {
  const { currency } = data;
  const { incomeMinor, expenseMinor, netMinor } = data.scoped;
  const margin = incomeMinor > 0 ? netMinor / incomeMinor : 0;

  const rows = [
    { label: "Gross income", value: formatMoney(incomeMinor, currency) },
    { label: "Expenses", value: formatMoney(expenseMinor, currency) },
    {
      label: "Net profit",
      value: formatMoney(netMinor, currency),
      strong: true,
    },
    { label: "Margin", value: `${(margin * 100).toFixed(0)}%` },
  ];

  return (
    <WidgetCard title="Profitability" caption={timeframeLabel(data.timeframe)}>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between text-sm"
          >
            <span
              className={r.strong ? "font-medium" : "text-muted-foreground"}
            >
              {r.label}
            </span>
            <span className={`tabular-nums ${r.strong ? "font-semibold" : ""}`}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
