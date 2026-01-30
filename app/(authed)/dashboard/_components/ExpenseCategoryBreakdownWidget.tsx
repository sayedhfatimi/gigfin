'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  Pie,
  BarChart as RechartBarChart,
  PieChart as RechartPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGlobalTimeframe } from '@/lib/contexts/GlobalTimeframeContext';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import { type ExpenseEntry, formatExpenseType } from '@/lib/expenses';
import { getExpenseEntriesForTimeframe } from '../_lib/expenseBreakdownTimeframes';

type ChartType = 'pie' | 'bar';

type ExpenseCategoryBreakdownPanelProps = {
  expenses: ExpenseEntry[];
  currency: CurrencyCode;
};

const STORAGE_KEY = 'expense-breakdown-chart-type';

const palette = [
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#F43F5E',
  '#0EA5E9',
  '#EAB308',
];

export function ExpenseCategoryBreakdownWidget({
  expenses,
  currency,
}: ExpenseCategoryBreakdownPanelProps) {
  const { timeframe, selectedOption } = useGlobalTimeframe();
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [showSettings, setShowSettings] = useState(false);

  // Load preference from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'pie' || stored === 'bar') {
      setChartType(stored);
    }
  }, []);

  // Save preference to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, chartType);
  }, [chartType]);

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

  const chartData = useMemo(
    () =>
      categoryDistribution.map((segment, index) => ({
        name: formatExpenseType(segment.expenseType),
        category: formatExpenseType(segment.expenseType),
        value: segment.amount,
        amount: segment.amount,
        fill: palette[index % palette.length],
      })),
    [categoryDistribution],
  );

  const hasData = chartData.length > 0;
  const chartLabel = chartType === 'pie' ? 'Pie' : 'Bar';

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm overflow-hidden'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Expense breakdown
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            {chartLabel} · {selectedOption.label}
          </p>
        </div>
        <div className='relative'>
          <button
            type='button'
            onClick={() => setShowSettings(!showSettings)}
            className='btn btn-ghost btn-xs btn-circle'
            aria-label='Chart settings'
          >
            <i className='fa-solid fa-gear' />
          </button>

          {showSettings && (
            <div className='absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-base-content/10 bg-base-100 p-4 shadow-lg'>
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase text-base-content/60'>
                  Chart Type
                </p>
                <div className='flex gap-2'>
                  <button
                    type='button'
                    onClick={() => setChartType('pie')}
                    className={`btn btn-xs flex-1 ${
                      chartType === 'pie' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    <i className='fa-solid fa-chart-pie mr-1' />
                    Pie
                  </button>
                  <button
                    type='button'
                    onClick={() => setChartType('bar')}
                    className={`btn btn-xs flex-1 ${
                      chartType === 'bar' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    <i className='fa-solid fa-chart-column mr-1' />
                    Bar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className='mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center'>
        <div className='h-44 w-full'>
          {hasData ? (
            chartType === 'pie' ? (
              <ResponsiveContainer width='100%' height='100%'>
                <RechartPieChart>
                  <Pie
                    data={chartData}
                    dataKey='value'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    innerRadius={34}
                    outerRadius={64}
                    paddingAngle={2}
                  >
                    {chartData.map((segment, index) => (
                      <Cell
                        key={`${segment.name}-${index}`}
                        fill={palette[index % palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value), currency)
                    }
                    labelFormatter={(label) => String(label)}
                  />
                </RechartPieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <RechartBarChart
                  data={chartData}
                  margin={{ top: 8, right: 16, bottom: 6, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='#E5E7EB'
                    vertical={false}
                  />
                  <XAxis
                    dataKey='category'
                    tick={{ fill: '#475569', fontSize: 10 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      formatCurrency(Number(value), currency)
                    }
                    tick={{ fill: '#475569', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value), currency)
                    }
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar dataKey='amount' radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`${entry.category}-${index}`}
                        fill={entry.fill}
                      />
                    ))}
                  </Bar>
                </RechartBarChart>
              </ResponsiveContainer>
            )
          ) : (
            <div
              className={`flex h-full items-center justify-center border border-dashed border-base-content/20 text-xs text-base-content/50 ${
                chartType === 'pie' ? 'rounded-full' : 'rounded'
              }`}
            >
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
