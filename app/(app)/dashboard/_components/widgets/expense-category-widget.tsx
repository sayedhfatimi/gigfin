"use client";

import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { timeframeLabel } from "@/lib/dates";
import { categoryDistribution } from "@/lib/expenses-agg";
import { titleCase } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Expenses by category over the active timeframe. Global.
export function ExpenseCategoryWidget({ data }: WidgetProps) {
  const items = categoryDistribution(data.scoped.expenses).map((c) => ({
    label: titleCase(c.expenseType),
    amountMinor: c.amountMinor,
  }));

  return (
    <WidgetCard
      title="Expenses by category"
      caption={timeframeLabel(data.timeframe)}
    >
      <BreakdownList
        items={items}
        currency={data.currency}
        empty="No expenses in this period."
      />
    </WidgetCard>
  );
}
