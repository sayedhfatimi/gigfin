"use client";

import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { timeframeLabel } from "@/lib/dates";
import { platformDistribution } from "@/lib/income";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Income by platform over the active timeframe. Global.
export function PlatformBreakdownWidget({ data }: WidgetProps) {
  const items = platformDistribution(data.scoped.income).map((p) => ({
    label: p.platform,
    amountMinor: p.amountMinor,
  }));

  return (
    <WidgetCard
      title="Income by platform"
      caption={timeframeLabel(data.timeframe)}
    >
      <BreakdownList
        items={items}
        currency={data.currency}
        empty="No income in this period."
      />
    </WidgetCard>
  );
}
