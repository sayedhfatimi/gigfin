"use client";

import { incomePerMileSeries } from "@/lib/daily";
import { timeframeLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { toMiles } from "@/lib/odometer";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";
import { Sparkline } from "./sparkline";

// Income earned per business mile driven, over the active timeframe. Global.
export function IncomePerMileWidget({ data }: WidgetProps) {
  const miles = toMiles(data.scoped.distance, data.odometerUnit);
  const perMile =
    miles > 0 ? Math.round(data.scoped.incomeMinor / miles) : null;
  const series = incomePerMileSeries(
    data.scoped.income,
    data.scoped.odometers,
    data.odometerUnit,
  );

  return (
    <WidgetCard
      title="Income per mile"
      caption={timeframeLabel(data.timeframe)}
    >
      <p className="font-semibold text-3xl tabular-nums">
        {perMile === null ? "—" : `${formatMoney(perMile, data.currency)}/mi`}
      </p>
      <Sparkline
        className="mt-3 aspect-auto h-10 w-full"
        data={series.map((d) =>
          d.perMileMinor === null ? null : d.perMileMinor / 100,
        )}
      />
      <p className="mt-1 text-muted-foreground text-sm tabular-nums">
        {Math.round(miles).toLocaleString()} mi ·{" "}
        {formatMoney(data.scoped.incomeMinor, data.currency)}
      </p>
    </WidgetCard>
  );
}
