"use client";

import { timeframeLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { toMiles } from "@/lib/odometer";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Fuel/charging spend per mile — the running energy cost of driving. Global.
export function RunningCostWidget({ data }: WidgetProps) {
  const fuelMinor = data.scoped.expenses.reduce(
    (acc, e) => (e.expenseType === "fuel_charging" ? acc + e.amountMinor : acc),
    0,
  );
  const miles = toMiles(data.scoped.distance, data.odometerUnit);
  const perMile = miles > 0 ? Math.round(fuelMinor / miles) : null;

  return (
    <WidgetCard title="Running cost" caption={timeframeLabel(data.timeframe)}>
      <p className="font-semibold text-3xl tabular-nums">
        {perMile === null ? "—" : `${formatMoney(perMile, data.currency)}/mi`}
      </p>
      <p className="mt-1 text-muted-foreground text-sm tabular-nums">
        {formatMoney(fuelMinor, data.currency)} fuel/charging ·{" "}
        {Math.round(miles).toLocaleString()} mi
      </p>
    </WidgetCard>
  );
}
