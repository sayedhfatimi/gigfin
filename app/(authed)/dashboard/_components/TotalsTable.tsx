'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  formatCurrency,
  getMonthlyTotals,
  type IncomeEntry,
} from '@/lib/income';

type TotalsTableProps = {
  incomes: IncomeEntry[];
};

type TotalsTimeframe = 'months' | 'weeks' | 'days';

type TotalsOption = {
  value: TotalsTimeframe;
  label: string;
};

const timeframeOptions: TotalsOption[] = [
  {
    value: 'months',
    label: 'Last 6 months',
  },
  {
    value: 'weeks',
    label: 'Last 6 weeks',
  },
  {
    value: 'days',
    label: 'Last 6 days',
  },
];

const STORAGE_KEY = 'dashboard-totals-table-timeframe';

type TotalsSummary = {
  key: string;
  label: string;
  total: number;
};

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const normalizeStartOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const normalizeEndOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const parseEntryDate = (entry: IncomeEntry) => {
  const parsed = new Date(entry.date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const getWeekStart = (date: Date) => {
  const normalized = new Date(date);
  const offset = (normalized.getDay() + 6) % 7;
  normalized.setDate(normalized.getDate() - offset);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const buildDailyTotals = (
  entries: IncomeEntry[],
  days: number,
  reference = new Date(),
): TotalsSummary[] => {
  const totals = new Map<string, number>();
  const end = normalizeEndOfDay(reference);
  const start = normalizeStartOfDay(end);
  start.setDate(start.getDate() - (days - 1));

  entries.forEach((entry) => {
    const entryDate = parseEntryDate(entry);
    if (!entryDate) {
      return;
    }
    if (entryDate < start || entryDate > end) {
      return;
    }
    const key = formatDateKey(entryDate);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  });

  const data: TotalsSummary[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const current = new Date(end);
    current.setDate(end.getDate() - offset);
    const key = formatDateKey(current);
    data.push({
      key,
      label: weekdayFormatter.format(current),
      total: totals.get(key) ?? 0,
    });
  }
  return data;
};

const buildWeeklyTotals = (
  entries: IncomeEntry[],
  weeks: number,
  reference = new Date(),
): TotalsSummary[] => {
  const totals = new Map<string, number>();
  const end = normalizeEndOfDay(reference);
  const currentWeekStart = getWeekStart(reference);
  const earliestWeekStart = new Date(currentWeekStart);
  earliestWeekStart.setDate(currentWeekStart.getDate() - (weeks - 1) * 7);

  entries.forEach((entry) => {
    const entryDate = parseEntryDate(entry);
    if (!entryDate) {
      return;
    }
    if (entryDate < earliestWeekStart || entryDate > end) {
      return;
    }
    const weekStart = getWeekStart(entryDate);
    const key = weekStart.toISOString();
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  });

  const data: TotalsSummary[] = [];
  for (let offset = 0; offset < weeks; offset += 1) {
    const targetWeekStart = new Date(currentWeekStart);
    targetWeekStart.setDate(currentWeekStart.getDate() - offset * 7);
    const key = targetWeekStart.toISOString();
    data.push({
      key,
      label: `Week of ${dayFormatter.format(targetWeekStart)}`,
      total: totals.get(key) ?? 0,
    });
  }
  return data;
};

const buildMonthlyTotals = (entries: IncomeEntry[]) => {
  return getMonthlyTotals(entries, 6).map((summary) => ({
    key: `${summary.year}-${summary.month}`,
    label: summary.label,
    total: summary.total,
  }));
};

const getTotalsForTimeframe = (
  timeframe: TotalsTimeframe,
  incomes: IncomeEntry[],
): TotalsSummary[] => {
  switch (timeframe) {
    case 'weeks':
      return buildWeeklyTotals(incomes, 6);
    case 'days':
      return buildDailyTotals(incomes, 6);
    default:
      return buildMonthlyTotals(incomes);
  }
};

export function TotalsTable({ incomes }: TotalsTableProps) {
  const [timeframe, setTimeframe] = useState<TotalsTimeframe>('months');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && timeframeOptions.some((option) => option.value === stored)) {
      setTimeframe(stored as TotalsTimeframe);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, timeframe);
  }, [timeframe]);

  const selectedOption =
    timeframeOptions.find((option) => option.value === timeframe) ??
    timeframeOptions[0];

  const totalsData = useMemo(
    () => getTotalsForTimeframe(timeframe, incomes),
    [incomes, timeframe],
  );

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>Totals</h2>
          <p className='text-xs uppercase text-base-content/60'>
            {selectedOption.label}
          </p>
        </div>
        <div className='flex items-end gap-2'>
          <label className='select select-xs'>
            <span className='label hidden md:block'>Timeframe</span>
            <select
              id='totals-table-timeframe'
              value={timeframe}
              onChange={(event) =>
                setTimeframe(event.target.value as TotalsTimeframe)
              }
            >
              {timeframeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className='mt-4 overflow-x-auto'>
        <table className='table w-full table-zebra'>
          <thead>
            <tr>
              <th className='text-left text-xs uppercase text-base-content/50'>
                Period
              </th>
              <th className='text-left text-xs uppercase text-base-content/50'>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {totalsData.map((summary, index) => (
              <tr
                key={summary.key}
                className={index === 0 ? 'font-semibold text-base-content' : ''}
              >
                <td>{summary.label}</td>
                <td className='font-semibold text-base-content'>
                  {formatCurrency(summary.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
