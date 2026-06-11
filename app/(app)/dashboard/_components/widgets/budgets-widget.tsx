"use client";

import { BudgetsCard } from "@/components/dashboard/budgets-card";
import type { WidgetProps } from "../widget-types";

// Budgets carry their own period; this just surfaces the existing card. Fixed.
export function BudgetsWidget({ data }: WidgetProps) {
  return <BudgetsCard currency={data.currency} />;
}
