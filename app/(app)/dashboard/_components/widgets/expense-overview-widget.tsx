"use client";

import { timeframeLabel } from "@/lib/dates";
import { categoryDistribution } from "@/lib/expenses-agg";
import { formatMoney, titleCase } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Total spend, count and biggest category for the active timeframe. Global.
export function ExpenseOverviewWidget({ data }: WidgetProps) {
  const { currency } = data;
  const total = data.scoped.expenseMinor;
  const count = data.scoped.expenses.length;
  const top = categoryDistribution(data.scoped.expenses)[0];

  return (
    <WidgetCard
      title="Expense overview"
      caption={timeframeLabel(data.timeframe)}
    >
      <p className="font-semibold text-3xl tabular-nums">
        {formatMoney(total, currency)}
      </p>
      <p className="mt-1 text-muted-foreground text-sm">
        {count} {count === 1 ? "expense" : "expenses"}
        {top
          ? ` · most on ${titleCase(top.expenseType)} (${(top.pct * 100).toFixed(0)}%)`
          : ""}
      </p>
    </WidgetCard>
  );
}
