"use client";

import { timeframeLabel } from "@/lib/dates";
import { platformDistribution } from "@/lib/income";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Dependency risk: the largest single platform's share of income. Global.
export function PlatformConcentrationWidget({ data }: WidgetProps) {
  const dist = platformDistribution(data.scoped.income);
  const top = dist[0];
  const pct = top ? Math.round(top.pct * 100) : 0;

  return (
    <WidgetCard
      title="Platform concentration"
      caption={timeframeLabel(data.timeframe)}
    >
      {top ? (
        <>
          <p className="font-semibold text-3xl tabular-nums">{pct}%</p>
          <p className="mt-1 text-muted-foreground text-sm">
            from {top.platform}
            {pct >= 70 ? " · consider diversifying" : ""}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          No income in this period.
        </p>
      )}
    </WidgetCard>
  );
}
