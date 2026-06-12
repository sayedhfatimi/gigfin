"use client";

import { TaxCard } from "@/components/dashboard/tax-card";
import { categoryDistribution } from "@/lib/expenses-agg";
import { distanceOf, toMiles } from "@/lib/odometer";
import type { WidgetProps } from "../widget-types";

const sumInYear = <T extends { date: string }>(
  rows: readonly T[],
  year: number,
  pick: (r: T) => number,
) =>
  rows.reduce(
    (acc, r) => (r.date.startsWith(`${year}-`) ? acc + pick(r) : acc),
    0,
  );

// Tax-year estimate. Fixed (tax year). TaxCard renders its own card.
export function TaxWidget({ data }: WidgetProps) {
  const year = new Date().getFullYear();
  const incomeMinor = sumInYear(data.income, year, (r) => r.amountMinor);
  const byCategory = categoryDistribution(
    data.expenses.filter((r) => r.date.startsWith(`${year}-`)),
  );
  const distance = sumInYear(data.odometers, year, distanceOf);

  return (
    <TaxCard
      jurisdiction={data.jurisdiction}
      currency={data.currency}
      year={year}
      incomeMinor={incomeMinor}
      byCategory={byCategory}
      miles={toMiles(distance, data.odometerUnit)}
    />
  );
}
