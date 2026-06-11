"use client";

import { timeframeLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { toMiles } from "@/lib/odometer";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Income earned per business mile driven, over the active timeframe. Global.
export function IncomePerMileWidget({ data }: WidgetProps) {
  const miles = toMiles(data.scoped.distance, data.odometerUnit);
  const perMile =
    miles > 0 ? Math.round(data.scoped.incomeMinor / miles) : null;

  return (
    <WidgetCard
      title="Income per mile"
      caption={timeframeLabel(data.timeframe)}
    >
      <p className="font-semibold text-3xl tabular-nums">
        {perMile === null ? "—" : `${formatMoney(perMile, data.currency)}/mi`}
      </p>
      <p className="mt-1 text-muted-foreground text-sm tabular-nums">
        {Math.round(miles).toLocaleString()} mi ·{" "}
        {formatMoney(data.scoped.incomeMinor, data.currency)}
      </p>
    </WidgetCard>
  );
}
