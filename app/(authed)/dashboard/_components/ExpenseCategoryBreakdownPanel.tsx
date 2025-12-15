'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart as RechartPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import { type ExpenseEntry, formatExpenseType } from '@/lib/expenses';
import { getExpenseEntriesForTimeframe } from '../_lib/expenseBreakdownTimeframes';
import {
  type TimeframeKey,
  timeframeOptions,
} from '../_lib/platformBreakdownTimeframes';

type ExpenseCategoryBreakdownPanelProps = {
  expenses: ExpenseEntry[];
  currency: CurrencyCode;
};

const TIMEFRAME_STORAGE_KEY = 'dashboard-expense-category-timeframe';

const palette = [
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#F43F5E',
  '#0EA5E9',
  '#EAB308',
];

export function ExpenseCategoryBreakdownPanel({
  expenses,
  currency,
}: ExpenseCategoryBreakdownPanelProps) {
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
    () => getExpenseEntriesForTimeframe(expenses, timeframe),
    [expenses, timeframe],
  );

  const categoryDistribution = useMemo(() => {
    const totals = new Map<string, number>();
    let total = 0;
    filteredEntries.forEach((entry) => {
      const amount = entry.amountMinor / 100;
      total += amount;
      totals.set(
        entry.expenseType,
        (totals.get(entry.expenseType) ?? 0) + amount,
      );
    });
    return Array.from(totals.entries())
      .map(([expenseType, amount]) => ({
        expenseType,
        amount,
        percentage: total ? amount / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredEntries]);

  const pieChartData = useMemo(
    () =>
      categoryDistribution.map((segment) => ({
        name: formatExpenseType(segment.expenseType),
        value: segment.amount,
      })),
    [categoryDistribution],
  );

  const hasData = pieChartData.length > 0;

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Expense breakdown
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            Pie · {selectedOption.label}
          </p>
        </div>
        <div className='flex items-end gap-2'>
          <label className='select select-xs'>
            <span className='label hidden md:block'>Timeframe</span>
            <select
              id='expense-breakdown-timeframe'
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
          {hasData ? (
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
                  formatter={(value) => formatCurrency(Number(value), currency)}
                  labelFormatter={(label) => String(label)}
                />
              </RechartPieChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex h-full items-center justify-center rounded-full border border-dashed border-base-content/20 text-xs text-base-content/50'>
              No {selectedOption.label.toLowerCase()} expense data yet
            </div>
          )}
        </div>
        <div className='space-y-3 text-sm'>
          {categoryDistribution.map((item, index) => (
            <div
              key={item.expenseType}
              className='flex items-center justify-between gap-4'
            >
              <span className='flex items-center gap-3'>
                <span
                  className='h-3 w-3 rounded-full'
                  style={{
                    backgroundColor: palette[index % palette.length],
                  }}
                />
                <span className='text-base-content'>
                  {formatExpenseType(item.expenseType)}
                </span>
              </span>
              <span className='font-semibold text-base-content'>
                {formatCurrency(item.amount, currency)}
              </span>
            </div>
          ))}
          {!categoryDistribution.length && (
            <p className='text-xs text-base-content/50'>
              Log expenses on the Logs tab to build this chart.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
