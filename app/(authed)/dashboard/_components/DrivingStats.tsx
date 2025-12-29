'use client';

import { useMemo } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import { getCurrentMonthExpenses } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import { getCurrentMonthEntries } from '@/lib/income';
import type { OdometerUnit } from '@/lib/odometer';
import { formatOdometerDistance, getOdometerDistance } from '@/lib/odometer';
import { useOdometerLogs } from '@/lib/queries/odometers';

const UNIT_LABEL: Record<OdometerUnit, string> = {
  km: 'km',
  miles: 'mi',
};

const parseOdometerMonth = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth(),
  };
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
  const fuelExpenseTotal = useMemo(
    () =>
      currentMonthExpenseEntries
        .filter((entry) => entry.expenseType === 'fuel_charging')
        .reduce((acc, entry) => acc + entry.amountMinor / 100, 0),
    [currentMonthExpenseEntries],
  );

  const referenceDate = new Date();
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const currentMonthOdometers = useMemo(() => {
    return odometerEntries.filter((entry) => {
      const parsed = parseOdometerMonth(entry.date);
      if (!parsed) {
        return false;
      }
      return parsed.year === currentYear && parsed.month === currentMonth;
    });
  }, [odometerEntries, currentYear, currentMonth]);

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

  const averageDistancePerLog =
    entriesThisMonth === 0 ? 0 : distanceThisMonth / entriesThisMonth;
  const netProfit = currentMonthIncomeTotal - currentMonthExpenseTotal;

  const costPerUnit = distanceThisMonth
    ? currentMonthExpenseTotal / distanceThisMonth
    : null;
  const fuelCostPerUnit = distanceThisMonth
    ? fuelExpenseTotal / distanceThisMonth
    : null;
  const profitPerUnit = distanceThisMonth
    ? netProfit / distanceThisMonth
    : null;
  const incomePerUnit = distanceThisMonth
    ? currentMonthIncomeTotal / distanceThisMonth
    : null;

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
      <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <p className='text-xs uppercase text-base-content/60'>
            Average cost / {odometerUnitLabel}
          </p>
          <p className='text-3xl font-semibold text-base-content'>
            {formatPerUnit(costPerUnit, currency, odometerUnitLabel)}
          </p>
          <p className='text-xs text-base-content/50'>
            Based on current month spend
          </p>
        </article>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <p className='text-xs uppercase text-base-content/60'>
            Fuel / charging cost / {odometerUnitLabel}
          </p>
          <p className='text-3xl font-semibold text-base-content'>
            {formatPerUnit(fuelCostPerUnit, currency, odometerUnitLabel)}
          </p>
          <p className='text-xs text-base-content/50'>
            Based on fuel & charging spend
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
