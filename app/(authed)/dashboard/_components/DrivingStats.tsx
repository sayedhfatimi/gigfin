'use client';

import { useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import { getCurrentMonthExpenses } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import { getCurrentMonthEntries } from '@/lib/income';
import type { OdometerEntry, OdometerUnit } from '@/lib/odometer';
import { formatOdometerDistance, getOdometerDistance } from '@/lib/odometer';
import { useOdometerLogs } from '@/lib/queries/odometers';

const UNIT_LABEL: Record<OdometerUnit, string> = {
  km: 'km',
  miles: 'mi',
};

type FuelCostRange = 'today' | 'this_week' | 'this_month' | 'year_to_date';

const FUEL_COST_RANGE_OPTIONS: { value: FuelCostRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'year_to_date', label: 'Year to date' },
];

const parseDateValue = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const getDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const getStartOfDay = (reference: Date) => {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getStartOfWeek = (reference: Date) => {
  const start = getStartOfDay(reference);
  const day = start.getDay();
  const offset = (day + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
};

const getRangeStart = (range: FuelCostRange, reference: Date) => {
  switch (range) {
    case 'today':
      return getStartOfDay(reference);
    case 'this_week':
      return getStartOfWeek(reference);
    case 'this_month': {
      const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'year_to_date': {
      const start = new Date(reference.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    default:
      return getStartOfDay(reference);
  }
};

const isDateInRange = (date: Date, range: FuelCostRange, reference: Date) => {
  const start = getRangeStart(range, reference);
  return (
    date.getTime() >= start.getTime() && date.getTime() <= reference.getTime()
  );
};

type DrivingStatsProps = {
  currency: CurrencyCode;
  expenses: ExpenseEntry[];
  incomes: IncomeEntry[];
  odometerUnit: OdometerUnit;
};

const formatPerUnit = (
  value: number | null,
  currency: CurrencyCode,
  unitLabel: string,
) => {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  return `${formatCurrency(value, currency)}/${unitLabel}`;
};

export function DrivingStats({
  incomes,
  expenses,
  currency,
  odometerUnit,
}: DrivingStatsProps) {
  const odometerUnitLabel = UNIT_LABEL[odometerUnit];
  const { data: odometerEntries = [], isLoading: isLoadingOdometers } =
    useOdometerLogs();
  const [selectedRange, setSelectedRange] =
    useState<FuelCostRange>('this_month');
  const datedOdometerEntries = useMemo(
    () =>
      odometerEntries
        .map((entry) => {
          const parsedDate = parseDateValue(entry.date);
          if (!parsedDate) {
            return null;
          }
          return { entry, date: parsedDate };
        })
        .filter(
          (value): value is { entry: OdometerEntry; date: Date } =>
            value !== null,
        ),
    [odometerEntries],
  );

  const currentMonthIncomeEntries = useMemo(
    () => getCurrentMonthEntries(incomes),
    [incomes],
  );
  const currentMonthExpenseEntries = useMemo(
    () => getCurrentMonthExpenses(expenses),
    [expenses],
  );

  const currentMonthIncomeTotal = useMemo(
    () =>
      currentMonthIncomeEntries.reduce((acc, entry) => acc + entry.amount, 0),
    [currentMonthIncomeEntries],
  );
  const currentMonthExpenseTotal = useMemo(
    () =>
      currentMonthExpenseEntries.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [currentMonthExpenseEntries],
  );
  const referenceDate = new Date();
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const currentMonthOdometers = useMemo(
    () =>
      datedOdometerEntries
        .filter(
          ({ date }) =>
            date.getFullYear() === currentYear &&
            date.getMonth() === currentMonth,
        )
        .map(({ entry }) => entry),
    [datedOdometerEntries, currentYear, currentMonth],
  );

  const lifetimeDistance = useMemo(
    () =>
      odometerEntries.reduce(
        (acc, entry) => acc + getOdometerDistance(entry),
        0,
      ),
    [odometerEntries],
  );
  const distanceThisMonth = useMemo(
    () =>
      currentMonthOdometers.reduce(
        (acc, entry) => acc + getOdometerDistance(entry),
        0,
      ),
    [currentMonthOdometers],
  );
  const entriesThisMonth = currentMonthOdometers.length;

  const odometerEntriesInSelectedRange = useMemo(
    () =>
      datedOdometerEntries.filter(({ date }) =>
        isDateInRange(date, selectedRange, referenceDate),
      ),
    [datedOdometerEntries, referenceDate, selectedRange],
  );
  const odometerDayKeysInSelectedRange = useMemo(() => {
    const set = new Set<string>();
    odometerEntriesInSelectedRange.forEach(({ date }) => {
      set.add(getDayKey(date));
    });
    return set;
  }, [odometerEntriesInSelectedRange]);
  const distanceInSelectedRange = useMemo(
    () =>
      odometerEntriesInSelectedRange.reduce(
        (acc, { entry }) => acc + getOdometerDistance(entry),
        0,
      ),
    [odometerEntriesInSelectedRange],
  );
  const fuelExpensesInSelectedRange = useMemo(() => {
    const rangeStart = getRangeStart(selectedRange, referenceDate);
    const rangeEnd = referenceDate;
    return expenses.filter((entry) => {
      if (entry.expenseType !== 'fuel_charging') {
        return false;
      }
      const parsedDate = parseDateValue(entry.paidAt);
      if (!parsedDate) {
        return false;
      }
      if (parsedDate.getTime() < rangeStart.getTime()) {
        return false;
      }
      if (parsedDate.getTime() > rangeEnd.getTime()) {
        return false;
      }
      return odometerDayKeysInSelectedRange.has(getDayKey(parsedDate));
    });
  }, [expenses, odometerDayKeysInSelectedRange, referenceDate, selectedRange]);
  const fuelExpenseTotalInSelectedRange = useMemo(
    () =>
      fuelExpensesInSelectedRange.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [fuelExpensesInSelectedRange],
  );

  const averageDistancePerLog =
    entriesThisMonth === 0 ? 0 : distanceThisMonth / entriesThisMonth;
  const netProfit = currentMonthIncomeTotal - currentMonthExpenseTotal;

  const fuelCostPerUnit = distanceInSelectedRange
    ? fuelExpenseTotalInSelectedRange / distanceInSelectedRange
    : null;
  const profitPerUnit = distanceThisMonth
    ? netProfit / distanceThisMonth
    : null;
  const incomePerUnit = distanceThisMonth
    ? currentMonthIncomeTotal / distanceThisMonth
    : null;
  const selectedRangeLabel =
    FUEL_COST_RANGE_OPTIONS.find((option) => option.value === selectedRange)
      ?.label ?? 'Fuel / charging spend';

  if (isLoadingOdometers && odometerEntries.length === 0) {
    return (
      <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h2 className='text-lg font-semibold text-base-content'>
              Driving stats
            </h2>
            <p className='text-xs uppercase text-base-content/60'>
              Loading odometer readings
            </p>
          </div>
        </div>
        <p className='mt-6 text-sm text-base-content/60'>
          Hang tight while we fetch your distance logs.
        </p>
      </section>
    );
  }

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Driving stats
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            Odometry ·{' '}
            {referenceDate.toLocaleString('en-US', { month: 'long' })}
          </p>
        </div>
        <div className='text-right text-xs text-base-content/60'>
          <p>
            {entriesThisMonth} log{entriesThisMonth === 1 ? '' : 's'} this month
          </p>
          <p>
            Avg per log:{' '}
            {entriesThisMonth
              ? formatOdometerDistance(averageDistancePerLog, odometerUnit)
              : '—'}
          </p>
        </div>
      </div>
      <div className='mt-6 grid gap-4 sm:grid-cols-2'>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <p className='text-xs uppercase text-base-content/60'>
            Distance logged
          </p>
          <p className='text-3xl font-semibold text-base-content'>
            {entriesThisMonth === 0
              ? '—'
              : formatOdometerDistance(distanceThisMonth, odometerUnit)}
          </p>
          <p className='text-xs text-base-content/50'>
            {entriesThisMonth === 0
              ? 'Add an odometer entry to get started'
              : `${entriesThisMonth} readings this month`}
          </p>
        </article>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <p className='text-xs uppercase text-base-content/60'>
            Lifetime distance
          </p>
          <p className='text-3xl font-semibold text-base-content'>
            {formatOdometerDistance(lifetimeDistance, odometerUnit)}
          </p>
          <p className='text-xs text-base-content/50'>
            Based on {odometerEntries.length} logged readings
          </p>
        </article>
      </div>
      <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-xs uppercase text-base-content/60'>
              Fuel / charging cost / {odometerUnitLabel}
            </p>
            <select
              aria-label='Fuel range'
              className='rounded border border-base-content/20 bg-base-100 px-2 py-1 text-[10px] uppercase tracking-wide focus:border-base-content focus:outline-none'
              value={selectedRange}
              onChange={(event) =>
                setSelectedRange(event.target.value as FuelCostRange)
              }
            >
              {FUEL_COST_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className='text-3xl font-semibold text-base-content'>
            {formatPerUnit(fuelCostPerUnit, currency, odometerUnitLabel)}
          </p>
          <p className='text-xs text-base-content/50'>
            Based on {selectedRangeLabel.toLowerCase()} fuel & charging spend
            with odometer logs
          </p>
        </article>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <p className='text-xs uppercase text-base-content/60'>
            Average profit / {odometerUnitLabel}
          </p>
          <p className='text-3xl font-semibold text-base-content'>
            {formatPerUnit(profitPerUnit, currency, odometerUnitLabel)}
          </p>
          <p className='text-xs text-base-content/50'>
            Income − expenses for current month
          </p>
        </article>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <p className='text-xs uppercase text-base-content/60'>
            Income / {odometerUnitLabel}
          </p>
          <p className='text-3xl font-semibold text-base-content'>
            {formatPerUnit(incomePerUnit, currency, odometerUnitLabel)}
          </p>
          <p className='text-xs text-base-content/50'>
            Revenue per {odometerUnitLabel}
          </p>
        </article>
      </div>
    </section>
  );
}
