"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useTimeframe } from "@/lib/contexts/timeframe-context";
import { type DateRange, getTimeframeRange, inRange } from "@/lib/dates";
import { type DistanceUnit, distanceOf } from "@/lib/odometer";
import type { TaxJurisdiction } from "@/lib/tax";

type IncomeDoc = Doc<"income">;
type ExpenseDoc = Doc<"expenses">;
type OdometerDoc = Doc<"odometers">;
type ShiftDoc = Doc<"shifts">;

// Rows + headline totals scoped to the active global timeframe — what `global`
// widgets consume.
export type ScopedData = {
  income: IncomeDoc[];
  expenses: ExpenseDoc[];
  odometers: OdometerDoc[];
  shifts: ShiftDoc[];
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  distance: number; // in the user's odometer unit
  workedMinutes: number;
};

export type DashboardData = {
  loading: boolean;
  currency: string;
  odometerUnit: DistanceUnit;
  jurisdiction: TaxJurisdiction;
  timeframe: ReturnType<typeof useTimeframe>["timeframe"];
  range: DateRange;
  // Full (all-time) rows — `fixed` widgets derive their own windows from these.
  income: IncomeDoc[];
  expenses: ExpenseDoc[];
  odometers: OdometerDoc[];
  shifts: ShiftDoc[];
  scoped: ScopedData;
};

const sum = <T>(rows: readonly T[], pick: (r: T) => number) =>
  rows.reduce((acc, r) => acc + pick(r), 0);

// Subscribes once to the reactive list queries and derives everything the
// dashboard widgets need. `fixed` widgets read the raw rows; `global` widgets
// read `scoped` (filtered to the active timeframe). Tolerates a null profile.
export function useDashboardData(): DashboardData {
  const { timeframe } = useTimeframe();
  const profile = useQuery(api.profiles.getMine);
  const income = useQuery(api.income.list);
  const expenses = useQuery(api.expenses.list);
  const odometers = useQuery(api.odometers.list);
  const shifts = useQuery(api.shifts.list);

  const loading =
    profile === undefined ||
    income === undefined ||
    expenses === undefined ||
    odometers === undefined ||
    shifts === undefined;

  return useMemo<DashboardData>(() => {
    const inc = income ?? [];
    const exp = expenses ?? [];
    const odo = odometers ?? [];
    const shf = shifts ?? [];
    const range = getTimeframeRange(timeframe);

    const sIncome = inc.filter((r) => inRange(r.date, range));
    const sExpenses = exp.filter((r) => inRange(r.date, range));
    const sOdo = odo.filter((r) => inRange(r.date, range));
    const sShifts = shf.filter((r) => inRange(r.date, range));

    const incomeMinor = sum(sIncome, (r) => r.amountMinor);
    const expenseMinor = sum(sExpenses, (r) => r.amountMinor);

    return {
      loading,
      currency: profile?.currency ?? "GBP",
      odometerUnit: (profile?.odometerUnit ?? "km") as DistanceUnit,
      jurisdiction: (profile?.taxJurisdiction ?? "UK") as TaxJurisdiction,
      timeframe,
      range,
      income: inc,
      expenses: exp,
      odometers: odo,
      shifts: shf,
      scoped: {
        income: sIncome,
        expenses: sExpenses,
        odometers: sOdo,
        shifts: sShifts,
        incomeMinor,
        expenseMinor,
        netMinor: incomeMinor - expenseMinor,
        distance: sum(sOdo, distanceOf),
        workedMinutes: sum(sShifts, (r) => r.durationMin ?? 0),
      },
    };
  }, [loading, profile, income, expenses, odometers, shifts, timeframe]);
}
