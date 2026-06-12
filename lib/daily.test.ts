import { describe, expect, it } from "vitest";
import {
  buildOverviewDays,
  distancePerDay,
  expensePerDayMinor,
  groupByDay,
  incomePerDayMinor,
  incomePerMileSeries,
  workedMinutesPerDay,
} from "./daily";
import type { ExpenseRow } from "./expenses-agg";
import type { IncomeRow } from "./income";

const income: (IncomeRow & { _id: string })[] = [
  { _id: "i1", platform: "Flex", amountMinor: 6000, date: "2026-06-12" },
  { _id: "i2", platform: "Flex", amountMinor: 4000, date: "2026-06-12" },
  { _id: "i3", platform: "Uber", amountMinor: 2000, date: "2026-06-11" },
];
const expenses: (ExpenseRow & { _id: string })[] = [
  {
    _id: "e1",
    expenseType: "fuel_charging",
    amountMinor: 1800,
    date: "2026-06-12",
  },
];
const odometers = [
  { _id: "o1", startReading: 100, endReading: 186, date: "2026-06-12" }, // 86
  { _id: "o2", startReading: 200, date: "2026-06-11" }, // open -> 0
];
const shifts = [
  { _id: "s1", date: "2026-06-12", durationMin: 320 },
  { _id: "s2", date: "2026-06-11" }, // open, no durationMin
];

describe("groupByDay", () => {
  it("buckets rows by date, newest day first", () => {
    const groups = groupByDay(income);
    expect(groups.map((g) => g.date)).toEqual(["2026-06-12", "2026-06-11"]);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[1].entries).toHaveLength(1);
  });

  it("is empty for no rows", () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe("incomePerDayMinor / expensePerDayMinor", () => {
  it("sums minor units per day", () => {
    expect(incomePerDayMinor(income).get("2026-06-12")).toBe(10000);
    expect(incomePerDayMinor(income).get("2026-06-11")).toBe(2000);
    expect(expensePerDayMinor(expenses).get("2026-06-12")).toBe(1800);
  });
});

describe("distancePerDay", () => {
  it("sums closed readings and treats open as 0", () => {
    const m = distancePerDay(odometers);
    expect(m.get("2026-06-12")).toBe(86);
    expect(m.get("2026-06-11")).toBe(0);
  });
});

describe("workedMinutesPerDay", () => {
  it("sums durations, treating an open shift as 0", () => {
    const m = workedMinutesPerDay(shifts);
    expect(m.get("2026-06-12")).toBe(320);
    expect(m.get("2026-06-11")).toBe(0);
  });
});

describe("incomePerMileSeries", () => {
  it("computes per-mile in minor units, ascending by date", () => {
    const series = incomePerMileSeries(income, odometers, "mi");
    expect(series.map((p) => p.date)).toEqual(["2026-06-11", "2026-06-12"]);
    expect(series[1].perMileMinor).toBe(Math.round(10000 / 86)); // 116
  });

  it("yields null on a zero-mile day (chart gap)", () => {
    const series = incomePerMileSeries(income, odometers, "mi");
    expect(series[0].perMileMinor).toBeNull(); // 2026-06-11, open odometer
  });

  it("converts km distance to miles before dividing", () => {
    const inc: IncomeRow[] = [
      { platform: "Flex", amountMinor: 10000, date: "2026-06-12" },
    ];
    const odo = [{ startReading: 0, endReading: 16.0934, date: "2026-06-12" }];
    // 16.0934 km == 10 miles -> 10000 / 10 = 1000
    expect(incomePerMileSeries(inc, odo, "km")[0].perMileMinor).toBe(1000);
  });

  it("is empty for no rows", () => {
    expect(incomePerMileSeries([], [], "mi")).toEqual([]);
  });
});

describe("buildOverviewDays", () => {
  it("unions dates across all four datasets, newest first", () => {
    const days = buildOverviewDays(income, expenses, odometers, shifts);
    expect(days.map((d) => d.date)).toEqual(["2026-06-12", "2026-06-11"]);
  });

  it("computes totals and completeness flags per day", () => {
    const days = buildOverviewDays(income, expenses, odometers, shifts);
    const d12 = days.find((d) => d.date === "2026-06-12")!;
    expect(d12).toMatchObject({
      incomeMinor: 10000,
      expenseMinor: 1800,
      distance: 86,
      minutes: 320,
      has: { income: true, expenses: true, mileage: true, shifts: true },
    });
  });

  it("lights a type's dot from presence even when its value is zero (open entries)", () => {
    const days = buildOverviewDays(income, expenses, odometers, shifts);
    const d11 = days.find((d) => d.date === "2026-06-11")!;
    expect(d11).toMatchObject({
      incomeMinor: 2000,
      expenseMinor: 0,
      distance: 0, // open odometer
      minutes: 0, // open shift
      has: { income: true, expenses: false, mileage: true, shifts: true },
    });
  });

  it("is empty for no data", () => {
    expect(buildOverviewDays([], [], [], [])).toEqual([]);
  });
});
