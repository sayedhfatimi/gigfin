// Pure per-day aggregation over ISO-dated rows, shared by the dashboard
// income-per-mile chart and the logs day-grouping / Overview features. Money in
// integer minor units; distance in the user's odometer unit (callers convert to
// miles via `toMiles` where a mile-based figure is needed). Cross-domain, so it
// lives here rather than in the single-table aggregation modules.

import { type ExpenseRow, sumExpenseMinor } from "./expenses-agg";
import { type IncomeRow, sumIncomeMinor } from "./income";
import {
  type DistanceUnit,
  distanceOf,
  type OdometerRow,
  toMiles,
} from "./odometer";

export type DatedOdometerRow = OdometerRow & { date: string };
export type ShiftRow = { date: string; durationMin?: number };

export type DayGroup<T> = { date: string; entries: T[] };

// Bucket any ISO-dated rows by their `date`, newest day first (matches the logs'
// newest-first ordering and v1 `aggregateDailyIncomes`).
export function groupByDay<T extends { date: string }>(
  rows: readonly T[],
): DayGroup<T>[] {
  const byDay = new Map<string, T[]>();
  for (const r of rows) {
    const bucket = byDay.get(r.date);
    if (bucket) bucket.push(r);
    else byDay.set(r.date, [r]);
  }
  return [...byDay.entries()]
    .map(([date, entries]) => ({ date, entries }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function sumPerDay<T extends { date: string }>(
  rows: readonly T[],
  value: (r: T) => number,
): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.date, (m.get(r.date) ?? 0) + value(r));
  return m;
}

export function incomePerDayMinor(
  rows: readonly IncomeRow[],
): Map<string, number> {
  return sumPerDay(
    rows as readonly (IncomeRow & { date: string })[],
    (r) => r.amountMinor,
  );
}

export function expensePerDayMinor(
  rows: readonly ExpenseRow[],
): Map<string, number> {
  return sumPerDay(
    rows as readonly (ExpenseRow & { date: string })[],
    (r) => r.amountMinor,
  );
}

// Per-day distance in the user's odometer unit; open readings contribute 0.
export function distancePerDay(
  rows: readonly DatedOdometerRow[],
): Map<string, number> {
  return sumPerDay(rows, distanceOf);
}

// Per-day worked minutes; open shifts (no `durationMin`) contribute 0.
export function workedMinutesPerDay(
  rows: readonly ShiftRow[],
): Map<string, number> {
  return sumPerDay(rows, (r) => r.durationMin ?? 0);
}

// Income earned per business mile, per day, in minor units. `null` on zero-mile
// days so the chart renders a gap rather than a misleading point. Sorted
// ascending (oldest -> newest) for chronological line/sparkline rendering.
export function incomePerMileSeries(
  income: readonly IncomeRow[],
  odometers: readonly DatedOdometerRow[],
  unit: DistanceUnit,
): { date: string; perMileMinor: number | null }[] {
  const incomeByDay = incomePerDayMinor(income);
  const distanceByDay = distancePerDay(odometers);
  const dates = new Set<string>([
    ...incomeByDay.keys(),
    ...distanceByDay.keys(),
  ]);
  return [...dates]
    .sort((a, b) => (a < b ? -1 : 1))
    .map((date) => {
      const miles = toMiles(distanceByDay.get(date) ?? 0, unit);
      const incomeMinor = incomeByDay.get(date) ?? 0;
      return {
        date,
        perMileMinor: miles > 0 ? Math.round(incomeMinor / miles) : null,
      };
    });
}

export type OverviewDay = {
  date: string;
  incomeMinor: number;
  expenseMinor: number;
  distance: number; // in the user's odometer unit
  minutes: number;
  has: {
    income: boolean;
    expenses: boolean;
    mileage: boolean;
    shifts: boolean;
  };
};

// One row per day across the union of all four datasets, newest first. `has.*`
// flags reflect presence of >=1 entry of that type that day (independent of
// value), so an open shift/odometer still lights its completeness dot.
export function buildOverviewDays(
  income: readonly IncomeRow[],
  expenses: readonly ExpenseRow[],
  odometers: readonly DatedOdometerRow[],
  shifts: readonly ShiftRow[],
): OverviewDay[] {
  const incomeGroups = groupByDay(
    income as readonly (IncomeRow & { date: string })[],
  );
  const expenseGroups = groupByDay(
    expenses as readonly (ExpenseRow & { date: string })[],
  );
  const odometerGroups = groupByDay(odometers);
  const shiftGroups = groupByDay(shifts);

  const incomeBy = new Map(incomeGroups.map((g) => [g.date, g.entries]));
  const expenseBy = new Map(expenseGroups.map((g) => [g.date, g.entries]));
  const odometerBy = new Map(odometerGroups.map((g) => [g.date, g.entries]));
  const shiftBy = new Map(shiftGroups.map((g) => [g.date, g.entries]));

  const dates = new Set<string>([
    ...incomeBy.keys(),
    ...expenseBy.keys(),
    ...odometerBy.keys(),
    ...shiftBy.keys(),
  ]);

  return [...dates]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => {
      const inc = incomeBy.get(date) ?? [];
      const exp = expenseBy.get(date) ?? [];
      const odo = odometerBy.get(date) ?? [];
      const shf = shiftBy.get(date) ?? [];
      return {
        date,
        incomeMinor: sumIncomeMinor(inc),
        expenseMinor: sumExpenseMinor(exp),
        distance: odo.reduce((acc, r) => acc + distanceOf(r), 0),
        minutes: shf.reduce((acc, r) => acc + (r.durationMin ?? 0), 0),
        has: {
          income: inc.length > 0,
          expenses: exp.length > 0,
          mileage: odo.length > 0,
          shifts: shf.length > 0,
        },
      };
    });
}
