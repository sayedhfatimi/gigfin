"use client";

import { categoryDistribution } from "@/lib/expenses-agg";
import { formatMoney } from "@/lib/format";
import { distanceOf, toMiles } from "@/lib/odometer";
import { computeTaxableProfit } from "@/lib/tax";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// HMRC/IRS mileage allowance for the current tax year. Fixed (tax year). Shows
// whether the mileage method actually beats the user's actual vehicle costs.
export function MileageDeductionWidget({ data }: WidgetProps) {
  const year = new Date().getFullYear();
  const inYear = (date: string) => date.startsWith(`${year}-`);
  const distance = data.odometers.reduce(
    (acc, o) => (inYear(o.date) ? acc + distanceOf(o) : acc),
    0,
  );
  const miles = toMiles(distance, data.odometerUnit);
  const incomeMinor = data.income.reduce(
    (acc, r) => (inYear(r.date) ? acc + r.amountMinor : acc),
    0,
  );
  const breakdown = computeTaxableProfit({
    jurisdiction: data.jurisdiction,
    incomeMinor,
    byCategory: categoryDistribution(
      data.expenses.filter((r) => inYear(r.date)),
    ),
    miles,
  });

  return (
    <WidgetCard
      title="Mileage deduction"
      caption={`${data.jurisdiction} allowance · ${year}`}
    >
      <p className="font-semibold text-3xl tabular-nums">
        {formatMoney(breakdown.mileageAllowanceMinor, data.currency)}
      </p>
      <p className="mt-1 text-muted-foreground text-sm tabular-nums">
        on {Math.round(miles).toLocaleString()} mi —{" "}
        {breakdown.vehicleMethod === "mileage"
          ? "applied (beats actual vehicle costs)"
          : `not applied; actual vehicle costs ${formatMoney(breakdown.vehicleActualMinor, data.currency)} more beneficial`}
      </p>
    </WidgetCard>
  );
}
