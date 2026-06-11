"use client";

import { formatMoney } from "@/lib/format";
import { distanceOf, toMiles } from "@/lib/odometer";
import { mileageAllowanceMinor } from "@/lib/tax";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// HMRC/IRS mileage allowance for the current tax year. Fixed (tax year).
export function MileageDeductionWidget({ data }: WidgetProps) {
  const year = new Date().getFullYear();
  const distance = data.odometers.reduce(
    (acc, o) => (o.date.startsWith(`${year}-`) ? acc + distanceOf(o) : acc),
    0,
  );
  const miles = toMiles(distance, data.odometerUnit);
  const allowance = mileageAllowanceMinor(data.jurisdiction, miles);

  return (
    <WidgetCard
      title="Mileage deduction"
      caption={`${data.jurisdiction} allowance · ${year}`}
    >
      <p className="font-semibold text-3xl tabular-nums">
        {formatMoney(allowance, data.currency)}
      </p>
      <p className="mt-1 text-muted-foreground text-sm tabular-nums">
        on {Math.round(miles).toLocaleString()} mi (alternative to vehicle
        expenses)
      </p>
    </WidgetCard>
  );
}
