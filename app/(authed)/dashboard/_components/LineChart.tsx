'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as RechartLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CurrencyCode } from '@/lib/currency';
import {
  formatCurrency,
  getMonthlyTotals,
  type IncomeEntry,
} from '@/lib/income';

type LineChartProps = {
  incomes: IncomeEntry[];
  currency: CurrencyCode;
};

type LineGraphDatum = {
  label: string;
  total: number;
};

type LineGraphTimeframe = 'year' | 'month' | 'week';

type LineGraphTimeframeOption = {
  value: LineGraphTimeframe;
  label: string;
  description: string;
};

const timeframeOptions: LineGraphTimeframeOption[] = [
  {
    value: 'year',
    label: 'Past year',
    description: 'Month over month',
  },
  {
    value: 'month',
    label: 'Past month',
    description: 'Day by day',
  },
  {
    value: 'week',
    label: 'Past week',
    description: 'Day by day',
  },
];

const TIMEFRAME_STORAGE_KEY = 'dashboard-line-graph-timeframe';

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
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

const parseEntryDate = (entry: IncomeEntry) => {
  const parsed = new Date(entry.date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const buildDailyTotals = (
  entries: IncomeEntry[],
  days: number,
  includeWeekday = false,
  reference = new Date(),
): LineGraphDatum[] => {
  const totals = new Map<string, number>();
  const end = normalizeEndOfDay(reference);
  const start = normalizeStartOfDay(reference);
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

  const data: LineGraphDatum[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const current = new Date(start);
    current.setDate(current.getDate() + offset);
    const key = formatDateKey(current);
    data.push({
      label: includeWeekday
        ? weekdayFormatter.format(current)
        : dayFormatter.format(current),
      total: totals.get(key) ?? 0,
    });
  }
  return data;
};

const buildMonthlyTotals = (entries: IncomeEntry[]) => {
  const totals = getMonthlyTotals(entries, 12);
  return [...totals]
    .reverse()
    .map((row) => ({ label: row.label, total: row.total }));
};

export function LineChart({ incomes, currency }: LineChartProps) {
  const [timeframe, setTimeframe] = useState<LineGraphTimeframe>('year');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(TIMEFRAME_STORAGE_KEY);
    if (stored && timeframeOptions.some((option) => option.value === stored)) {
      setTimeframe(stored as LineGraphTimeframe);
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
    timeframeOptions[0];

  const lineChartData = useMemo<LineGraphDatum[]>(() => {
    switch (timeframe) {
      case 'week':
        return buildDailyTotals(incomes, 7, true);
      case 'month':
        return buildDailyTotals(incomes, 30);
      default:
        return buildMonthlyTotals(incomes);
    }
  }, [incomes, timeframe]);

  const lineChartMax = useMemo(() => {
    if (!lineChartData.length) {
      return 0;
    }
    return Math.max(...lineChartData.map((row) => row.total));
  }, [lineChartData]);

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Income trend
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            {selectedOption.description}
          </p>
        </div>
        <div className='flex items-end gap-2'>
          <label className='select select-xs'>
            <span className='label hidden md:block'>Timeframe</span>
            <select
              id='line-graph-timeframe'
              className='select select-sm select-bordered'
              value={timeframe}
              onChange={(event) =>
                setTimeframe(event.target.value as LineGraphTimeframe)
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
      <div className='mt-6'>
        <div className='h-60 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <RechartLineChart data={lineChartData}>
              <CartesianGrid
                strokeDasharray='3 3'
                strokeOpacity={0.2}
                vertical={false}
              />
              <XAxis
                dataKey='label'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) =>
                  formatCurrency(Number(value), currency)
                }
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
                labelFormatter={(label) => String(label)}
                contentStyle={{ fontSize: '12px' }}
              />
              <Line
                type='monotone'
                dataKey='total'
                stroke='#6366F1'
                strokeWidth={3}
                dot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </RechartLineChart>
          </ResponsiveContainer>
        </div>
        <div className='mt-3 flex items-center justify-between text-xs font-semibold text-base-content/60'>
          <span>{formatCurrency(0, currency)}</span>
          <span>{formatCurrency(lineChartMax, currency)}</span>
        </div>
      </div>
    </section>
  );
}
