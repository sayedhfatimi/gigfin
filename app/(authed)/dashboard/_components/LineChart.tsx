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
import type { ExpenseEntry } from '@/lib/expenses';
import { formatCurrency, type IncomeEntry } from '@/lib/income';

type LineChartProps = {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  currency: CurrencyCode;
};

type LineGraphDatum = {
  label: string;
  income: number;
  expense: number;
};

type LineGraphTimeframe = 'year' | 'month' | 'week';
type LineChartView = 'income' | 'expense' | 'both';

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
const VIEW_STORAGE_KEY = 'dashboard-line-graph-view';

const viewOptions: { value: LineChartView; label: string }[] = [
  { value: 'income', label: 'Income only' },
  { value: 'expense', label: 'Expenses only' },
  { value: 'both', label: 'Income + Expenses' },
];

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

const parseExpenseDate = (entry: ExpenseEntry) => {
  const parsed = new Date(entry.paidAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

type NormalizedEntry = {
  date: Date;
  amount: number;
};

const buildTotalsMapInRange = (
  entries: NormalizedEntry[],
  start: Date,
  end: Date,
) => {
  const totals = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.date < start || entry.date > end) {
      return;
    }
    const key = formatDateKey(entry.date);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  });
  return totals;
};

const buildDailyCombinedTotals = (
  incomeEntries: NormalizedEntry[],
  expenseEntries: NormalizedEntry[],
  days: number,
  includeWeekday = false,
  reference = new Date(),
): LineGraphDatum[] => {
  const end = normalizeEndOfDay(reference);
  const start = normalizeStartOfDay(reference);
  start.setDate(start.getDate() - (days - 1));

  const incomeTotals = buildTotalsMapInRange(incomeEntries, start, end);
  const expenseTotals = buildTotalsMapInRange(expenseEntries, start, end);

  const data: LineGraphDatum[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const current = new Date(start);
    current.setDate(current.getDate() + offset);
    const key = formatDateKey(current);
    data.push({
      label: includeWeekday
        ? weekdayFormatter.format(current)
        : dayFormatter.format(current),
      income: incomeTotals.get(key) ?? 0,
      expense: expenseTotals.get(key) ?? 0,
    });
  }
  return data;
};

const buildMonthlyTotalsMap = (entries: NormalizedEntry[]) => {
  const totals = new Map<string, number>();
  entries.forEach((entry) => {
    const key = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  });
  return totals;
};

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
});

const buildMonthlyCombinedTotals = (
  incomeEntries: NormalizedEntry[],
  expenseEntries: NormalizedEntry[],
  reference = new Date(),
): LineGraphDatum[] => {
  const incomeTotals = buildMonthlyTotalsMap(incomeEntries);
  const expenseTotals = buildMonthlyTotalsMap(expenseEntries);
  const data: LineGraphDatum[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(
      reference.getFullYear(),
      reference.getMonth() - offset,
      1,
    );
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    data.push({
      label: monthFormatter.format(date),
      income: incomeTotals.get(key) ?? 0,
      expense: expenseTotals.get(key) ?? 0,
    });
  }
  return data;
};

export function LineChart({ incomes, expenses, currency }: LineChartProps) {
  const [timeframe, setTimeframe] = useState<LineGraphTimeframe>('year');
  const [view, setView] = useState<LineChartView>('both');

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored && viewOptions.some((option) => option.value === stored)) {
      setView(stored as LineChartView);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const selectedOption =
    timeframeOptions.find((option) => option.value === timeframe) ??
    timeframeOptions[0];

  const normalizedIncomeEntries = useMemo<NormalizedEntry[]>(() => {
    return incomes
      .map((entry) => {
        const parsed = parseEntryDate(entry);
        if (!parsed) {
          return null;
        }
        return {
          date: parsed,
          amount: entry.amount,
        };
      })
      .filter((entry): entry is NormalizedEntry => entry !== null);
  }, [incomes]);

  const normalizedExpenseEntries = useMemo<NormalizedEntry[]>(() => {
    return expenses
      .map((entry) => {
        const parsed = parseExpenseDate(entry);
        if (!parsed) {
          return null;
        }
        return {
          date: parsed,
          amount: entry.amountMinor / 100,
        };
      })
      .filter((entry): entry is NormalizedEntry => entry !== null);
  }, [expenses]);

  const lineChartData = useMemo<LineGraphDatum[]>(() => {
    switch (timeframe) {
      case 'week':
        return buildDailyCombinedTotals(
          normalizedIncomeEntries,
          normalizedExpenseEntries,
          7,
          true,
        );
      case 'month':
        return buildDailyCombinedTotals(
          normalizedIncomeEntries,
          normalizedExpenseEntries,
          30,
        );
      default:
        return buildMonthlyCombinedTotals(
          normalizedIncomeEntries,
          normalizedExpenseEntries,
        );
    }
  }, [timeframe, normalizedIncomeEntries, normalizedExpenseEntries]);

  const isIncomeVisible = view !== 'expense';
  const isExpenseVisible = view !== 'income';

  const lineChartMax = useMemo(() => {
    if (!lineChartData.length) {
      return 0;
    }
    let max = 0;
    lineChartData.forEach((row) => {
      if (isIncomeVisible) {
        max = Math.max(max, row.income);
      }
      if (isExpenseVisible) {
        max = Math.max(max, row.expense);
      }
    });
    return max;
  }, [lineChartData, isIncomeVisible, isExpenseVisible]);

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Income & expense trend
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            {selectedOption.description}
          </p>
        </div>
        <div className='flex flex-col md:flex-row items-end gap-2'>
          <label className='select select-xs'>
            <span className='label hidden md:block'>Timeframe</span>
            <select
              id='line-graph-timeframe'
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
          <label className='select select-xs min-w-fit'>
            <span className='label hidden md:block'>Show</span>
            <select
              id='line-graph-view'
              value={view}
              onChange={(event) => setView(event.target.value as LineChartView)}
            >
              {viewOptions.map((option) => (
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
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickFormatter={(value) =>
                  formatCurrency(Number(value), currency)
                }
                axisLine={false}
                tickLine={false}
                width={72}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
                labelFormatter={(label) => String(label)}
                contentStyle={{ fontSize: '12px' }}
              />
              {isIncomeVisible && (
                <Line
                  type='monotone'
                  dataKey='income'
                  name='Income'
                  stroke='#6366F1'
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}
              {isExpenseVisible && (
                <Line
                  type='monotone'
                  dataKey='expense'
                  name='Expenses'
                  stroke='#EF4444'
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}
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
