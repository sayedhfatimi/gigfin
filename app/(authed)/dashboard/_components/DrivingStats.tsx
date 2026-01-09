'use client';

import { useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import type { OdometerEntry, OdometerUnit } from '@/lib/odometer';
import { formatOdometerDistance, getOdometerDistance } from '@/lib/odometer';
import { useOdometerLogs } from '@/lib/queries/odometers';

const UNIT_LABEL: Record<OdometerUnit, string> = {
  km: 'km',
  miles: 'mi',
};

type RangeFilter = 'today' | 'this_week' | 'this_month' | 'year_to_date';

const RANGE_FILTER_OPTIONS: { value: RangeFilter; label: string }[] = [
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

const getRangeStart = (range: RangeFilter, reference: Date) => {
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

const isDateInRange = (date: Date, range: RangeFilter, reference: Date) => {
  const start = getRangeStart(range, reference);
  return (
    date.getTime() >= start.getTime() && date.getTime() <= reference.getTime()
  );
};

type RangeOdometerData = {
  entries: OdometerEntry[];
  dayKeys: Set<string>;
  distance: number;
};

const buildRangeOdometerData = (
  range: RangeFilter,
  reference: Date,
  datedEntries: { entry: OdometerEntry; date: Date }[],
): RangeOdometerData => {
  const entriesInRange = datedEntries.filter(({ date }) =>
    isDateInRange(date, range, reference),
  );
  const dayKeys = new Set<string>();
  entriesInRange.forEach(({ date }) => {
    dayKeys.add(getDayKey(date));
  });
  const odometerEntries = entriesInRange.map(({ entry }) => entry);
  const distance = odometerEntries.reduce(
    (acc, entry) => acc + getOdometerDistance(entry),
    0,
  );
  return { entries: odometerEntries, dayKeys, distance };
};

const getRangeLabel = (range: RangeFilter) =>
  RANGE_FILTER_OPTIONS.find((option) => option.value === range)?.label ??
  'This month';

const filterEntriesByRangeAndOdometer = <T,>(
  entries: T[],
  getDateValue: (entry: T) => string,
  range: RangeFilter,
  reference: Date,
  dayKeys: Set<string>,
) =>
  entries.filter((entry) => {
    const parsed = parseDateValue(getDateValue(entry));
    if (!parsed) {
      return false;
    }
    if (!isDateInRange(parsed, range, reference)) {
      return false;
    }
    return dayKeys.has(getDayKey(parsed));
  });

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
  const [distanceRange, setDistanceRange] = useState<RangeFilter>('this_month');
  const [profitRange, setProfitRange] = useState<RangeFilter>('this_month');
  const [incomeRange, setIncomeRange] = useState<RangeFilter>('this_month');
  const [fuelRange, setFuelRange] = useState<RangeFilter>('this_month');
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

  const distanceRangeData = useMemo(
    () =>
      buildRangeOdometerData(
        distanceRange,
        referenceDate,
        datedOdometerEntries,
      ),
    [datedOdometerEntries, distanceRange, referenceDate],
  );
  const profitRangeData = useMemo(
    () =>
      buildRangeOdometerData(profitRange, referenceDate, datedOdometerEntries),
    [datedOdometerEntries, profitRange, referenceDate],
  );
  const incomeRangeData = useMemo(
    () =>
      buildRangeOdometerData(incomeRange, referenceDate, datedOdometerEntries),
    [datedOdometerEntries, incomeRange, referenceDate],
  );
  const fuelRangeData = useMemo(
    () =>
      buildRangeOdometerData(fuelRange, referenceDate, datedOdometerEntries),
    [datedOdometerEntries, fuelRange, referenceDate],
  );

  const distanceRangeLabel = getRangeLabel(distanceRange);
  const profitRangeLabel = getRangeLabel(profitRange);
  const incomeRangeLabel = getRangeLabel(incomeRange);
  const fuelRangeLabel = getRangeLabel(fuelRange);

  const fuelExpensesInSelectedRange = useMemo(
    () =>
      filterEntriesByRangeAndOdometer(
        expenses,
        (entry) => entry.paidAt,
        fuelRange,
        referenceDate,
        fuelRangeData.dayKeys,
      ).filter((entry) => entry.expenseType === 'fuel_charging'),
    [expenses, fuelRange, referenceDate, fuelRangeData.dayKeys],
  );
  const fuelExpenseTotalInSelectedRange = useMemo(
    () =>
      fuelExpensesInSelectedRange.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [fuelExpensesInSelectedRange],
  );

  const profitIncomeEntriesInRange = useMemo(
    () =>
      filterEntriesByRangeAndOdometer(
        incomes,
        (entry) => entry.date,
        profitRange,
        referenceDate,
        profitRangeData.dayKeys,
      ),
    [incomes, profitRange, referenceDate, profitRangeData.dayKeys],
  );
  const profitExpenseEntriesInRange = useMemo(
    () =>
      filterEntriesByRangeAndOdometer(
        expenses,
        (entry) => entry.paidAt,
        profitRange,
        referenceDate,
        profitRangeData.dayKeys,
      ),
    [expenses, profitRange, referenceDate, profitRangeData.dayKeys],
  );
  const totalIncomeInProfitRange = useMemo(
    () =>
      profitIncomeEntriesInRange.reduce((acc, entry) => acc + entry.amount, 0),
    [profitIncomeEntriesInRange],
  );
  const totalExpensesInProfitRange = useMemo(
    () =>
      profitExpenseEntriesInRange.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [profitExpenseEntriesInRange],
  );

  const incomeEntriesInRange = useMemo(
    () =>
      filterEntriesByRangeAndOdometer(
        incomes,
        (entry) => entry.date,
        incomeRange,
        referenceDate,
        incomeRangeData.dayKeys,
      ),
    [incomes, incomeRange, referenceDate, incomeRangeData.dayKeys],
  );
  const totalIncomeInIncomeRange = useMemo(
    () => incomeEntriesInRange.reduce((acc, entry) => acc + entry.amount, 0),
    [incomeEntriesInRange],
  );

  const averageDistancePerLog =
    entriesThisMonth === 0 ? 0 : distanceThisMonth / entriesThisMonth;

  const fuelCostPerUnit = fuelRangeData.distance
    ? fuelExpenseTotalInSelectedRange / fuelRangeData.distance
    : null;
  const netProfitForRange =
    totalIncomeInProfitRange - totalExpensesInProfitRange;
  const profitPerUnit = profitRangeData.distance
    ? netProfitForRange / profitRangeData.distance
    : null;
  const incomePerUnit = incomeRangeData.distance
    ? totalIncomeInIncomeRange / incomeRangeData.distance
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
          <div className='flex items-center justify-between gap-2'>
            <p className='text-xs uppercase text-base-content/60'>
              Distance logged
            </p>
            <label className='select select-xs max-w-fit'>
              <select
                aria-label='Distance range'
                value={distanceRange}
                onChange={(event) =>
                  setDistanceRange(event.target.value as RangeFilter)
                }
              >
                {RANGE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className='text-3xl font-semibold text-base-content'>
            {distanceRangeData.entries.length === 0
              ? '—'
              : formatOdometerDistance(
                  distanceRangeData.distance,
                  odometerUnit,
                )}
          </p>
          <p className='text-xs text-base-content/50'>
            {distanceRangeData.entries.length === 0
              ? `Add an odometer entry for ${distanceRangeLabel.toLowerCase()}`
              : `${distanceRangeData.entries.length} readings ${distanceRangeLabel.toLowerCase()}`}
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
            <label className='select select-xs max-w-fit'>
              <select
                aria-label='Fuel range'
                value={fuelRange}
                onChange={(event) =>
                  setFuelRange(event.target.value as RangeFilter)
                }
              >
                {RANGE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className='text-3xl font-semibold text-base-content'>
            {formatPerUnit(fuelCostPerUnit, currency, odometerUnitLabel)}
          </p>
          <p className='text-xs text-base-content/50'>
            Based on {fuelRangeLabel.toLowerCase()} fuel & charging spend with
            odometer logs
          </p>
        </article>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-xs uppercase text-base-content/60'>
              Average profit / {odometerUnitLabel}
            </p>
            <label className='select select-xs max-w-fit'>
              <select
                aria-label='Profit range'
                value={profitRange}
                onChange={(event) =>
                  setProfitRange(event.target.value as RangeFilter)
                }
              >
                {RANGE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className='text-3xl font-semibold text-base-content'>
            {formatPerUnit(profitPerUnit, currency, odometerUnitLabel)}
          </p>
          <p className='text-xs text-base-content/50'>
            Income − expenses for {profitRangeLabel.toLowerCase()} with odometer
            logs
          </p>
        </article>
        <article className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-xs uppercase text-base-content/60'>
              Income / {odometerUnitLabel}
            </p>
            <label className='select select-xs max-w-fit'>
              <select
                aria-label='Income range'
                value={incomeRange}
                onChange={(event) =>
                  setIncomeRange(event.target.value as RangeFilter)
                }
              >
                {RANGE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className='text-3xl font-semibold text-base-content'>
            {formatPerUnit(incomePerUnit, currency, odometerUnitLabel)}
          </p>
          <p className='text-xs text-base-content/50'>
            Revenue for {incomeRangeLabel.toLowerCase()} with odometer logs
          </p>
        </article>
      </div>
    </section>
  );
}
