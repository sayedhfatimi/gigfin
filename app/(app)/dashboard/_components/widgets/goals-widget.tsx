"use client";

import { GoalsCard } from "@/components/dashboard/goals-card";
import type { WidgetProps } from "../widget-types";

// Goals carry their own period; this just surfaces the existing card. Fixed.
export function GoalsWidget({ data }: WidgetProps) {
  return <GoalsCard currency={data.currency} />;
}
