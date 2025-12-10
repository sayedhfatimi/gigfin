'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart as RechartPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  formatCurrency,
  getCurrentMonthEntries,
  getPlatformDistribution,
  type IncomeEntry,
} from '@/lib/income';

type PieChartProps = {
  incomes: IncomeEntry[];
};

type TimeframeKey = 'weekly' | 'monthly' | 'yearToDate' | 'last12Months';

type TimeframeOption = {
  value: TimeframeKey;
  label: string;
};

const timeframeOptions: TimeframeOption[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearToDate', label: 'Year to date' },
  { value: 'last12Months', label: 'Last 12 months' },
];

const TIMEFRAME_STORAGE_KEY = 'dashboard-pie-chart-timeframe';

const palette = [
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#F43F5E',
  '#0EA5E9',
  '#EAB308',
];

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

const parseEntryDate = (entry: IncomeEntry) => {
  const parsed = new Date(entry.date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const filterEntriesBetween = (entries: IncomeEntry[], start: Date, end: Date) =>
  entries.filter((entry) => {
    const entryDate = parseEntryDate(entry);
    if (!entryDate) {
      return false;
    }
    return entryDate >= start && entryDate <= end;
  });

const getRecentDaysEntries = (
  entries: IncomeEntry[],
  days: number,
  reference = new Date(),
) => {
  const end = normalizeEndOfDay(reference);
  const start = normalizeStartOfDay(reference);
  start.setDate(start.getDate() - (days - 1));
  return filterEntriesBetween(entries, start, end);
};

const getYearToDateEntries = (
  entries: IncomeEntry[],
  reference = new Date(),
) => {
  const start = new Date(reference.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);
  const end = normalizeEndOfDay(reference);
  return filterEntriesBetween(entries, start, end);
};

const getLastTwelveMonthsEntries = (
  entries: IncomeEntry[],
  reference = new Date(),
) => {
  const start = new Date(reference.getFullYear(), reference.getMonth() - 11, 1);
  start.setHours(0, 0, 0, 0);
  const end = normalizeEndOfDay(reference);
  return filterEntriesBetween(entries, start, end);
};

const getEntriesForTimeframe = (
  entries: IncomeEntry[],
  timeframe: TimeframeKey,
) => {
  switch (timeframe) {
    case 'weekly':
      return getRecentDaysEntries(entries, 7);
    case 'monthly':
      return getCurrentMonthEntries(entries);
    case 'yearToDate':
      return getYearToDateEntries(entries);
    case 'last12Months':
      return getLastTwelveMonthsEntries(entries);
    default:
      return entries;
  }
};

export function PieChart({ incomes }: PieChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('monthly');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(TIMEFRAME_STORAGE_KEY);
    if (stored && timeframeOptions.some((option) => option.value === stored)) {
      setTimeframe(stored as TimeframeKey);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(TIMEFRAME_STORAGE_KEY, timeframe);
  }, [timeframe]);

  const selectedOption =
    timeframeOptions.find((option) => option.value === timeframe) ??
    timeframeOptions[1];

  const filteredEntries = useMemo(
    () => getEntriesForTimeframe(incomes, timeframe),
    [incomes, timeframe],
  );
  const platformDistribution = useMemo(
    () => getPlatformDistribution(filteredEntries),
    [filteredEntries],
  );
  const pieChartData = useMemo(
    () =>
      platformDistribution.map((segment) => ({
        name: segment.platform,
        value: segment.amount,
      })),
    [platformDistribution],
  );

  const hasPlatformData = pieChartData.length > 0;

  return (
    <section className=' border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Platform breakdown
          </h2>
          <p className='text-xs uppercase  text-base-content/60'>
            Pie · {selectedOption.label}
          </p>
        </div>
        <div className='flex items-end gap-2'>
          <label className='select select-xs'>
            <span className='label hidden md:block'>Timeframe</span>
            <select
              id='platform-breakdown-timeframe'
              value={timeframe}
              onChange={(event) =>
                setTimeframe(event.target.value as TimeframeKey)
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
      <div className='mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center'>
        <div className='h-44 w-full'>
          {hasPlatformData ? (
            <ResponsiveContainer width='100%' height='100%'>
              <RechartPieChart>
                <Pie
                  data={pieChartData}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  innerRadius={34}
                  outerRadius={64}
                  paddingAngle={2}
                >
                  {pieChartData.map((segment, index) => (
                    <Cell
                      key={`${segment.name}-${index}`}
                      fill={palette[index % palette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => String(label)}
                />
              </RechartPieChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex h-full items-center justify-center rounded-full border border-dashed border-base-content/20 text-xs text-base-content/50'>
              No {selectedOption.label.toLowerCase()} platform data yet
            </div>
          )}
        </div>
        <div className='space-y-3 text-sm'>
          {platformDistribution.map((item, index) => (
            <div
              key={item.platform}
              className='flex items-center justify-between gap-4'
            >
              <span className='flex items-center gap-3'>
                <span
                  className='h-3 w-3 rounded-full'
                  style={{
                    backgroundColor: palette[index % palette.length],
                  }}
                />
                <span className='text-base-content'>{item.platform}</span>
              </span>
              <span className='font-semibold text-base-content'>
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
          {!platformDistribution.length && (
            <p className='text-xs text-base-content/50'>
              Start adding logs on the Logs tab to build up{' '}
              {selectedOption.label.toLowerCase()} insights.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
