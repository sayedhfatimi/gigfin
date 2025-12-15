'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  BarChart as RechartBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CurrencyCode } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import { getYearlyMonthlyExpenseTotals } from '@/lib/expenses';
import {
  formatCurrency,
  getYearlyMonthlyTotals,
  type IncomeEntry,
} from '@/lib/income';

type YearlyRunRateChartProps = {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  currency: CurrencyCode;
};

type ChartView = 'income' | 'expense' | 'both';

const viewOptions: { value: ChartView; label: string }[] = [
  { value: 'income', label: 'Income only' },
  { value: 'expense', label: 'Expenses only' },
  { value: 'both', label: 'Income + Expenses' },
];

export function YearlyRunRateChart({
  incomes,
  expenses,
  currency,
}: YearlyRunRateChartProps) {
  const [view, setView] = useState<ChartView>('both');

  const isIncomeVisible = view !== 'expense';
  const isExpenseVisible = view !== 'income';

  const incomeChartData = useMemo(
    () => getYearlyMonthlyTotals(incomes),
    [incomes],
  );
  const expenseChartData = useMemo(
    () => getYearlyMonthlyExpenseTotals(expenses),
    [expenses],
  );
  const combinedChartData = useMemo(
    () =>
      incomeChartData.map((row, index) => ({
        label: row.label,
        income: row.total,
        expense: expenseChartData[index]?.total ?? 0,
      })),
    [incomeChartData, expenseChartData],
  );
  const hasData = combinedChartData.some(
    (row) => row.income > 0 || row.expense > 0,
  );
  const peakAmount = useMemo(() => {
    if (!combinedChartData.length) {
      return 0;
    }
    let max = 0;
    combinedChartData.forEach((row) => {
      if (isIncomeVisible) {
        max = Math.max(max, row.income);
      }
      if (isExpenseVisible) {
        max = Math.max(max, row.expense);
      }
    });
    return max;
  }, [combinedChartData, isIncomeVisible, isExpenseVisible]);

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Yearly run rate
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            Monthly totals · This year
          </p>
        </div>
        <div className='flex flex-col-reverse md:flex-row items-end md:items-center gap-2 whitespace-nowrap'>
          <label className='select select-xs'>
            <span className='label hidden md:block'>Show</span>
            <select
              id='yearly-run-rate-view'
              value={view}
              onChange={(event) => setView(event.target.value as ChartView)}
            >
              {viewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <span className='text-xs text-base-content/60'>
            Peak {formatCurrency(peakAmount, currency)}
          </span>
        </div>
      </div>
      <div className='mt-6 h-52 w-full'>
        {hasData ? (
          <ResponsiveContainer width='100%' height='100%'>
            <RechartBarChart
              data={combinedChartData}
              margin={{ top: 8, right: 16, bottom: 6, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='#E5E7EB'
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
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
                labelFormatter={(label) => String(label)}
                contentStyle={{ fontSize: '12px' }}
              />
              {isIncomeVisible && (
                <Bar
                  dataKey='income'
                  name='Income'
                  radius={[4, 4, 0, 0]}
                  fill='#6366F1'
                  barSize={20}
                />
              )}
              {isExpenseVisible && (
                <Bar
                  dataKey='expense'
                  name='Expenses'
                  radius={[4, 4, 0, 0]}
                  fill='#EF4444'
                  barSize={20}
                />
              )}
            </RechartBarChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-full items-center justify-center rounded border border-dashed border-base-content/20 text-xs text-base-content/50'>
            No transactions logged yet to build a yearly run rate
          </div>
        )}
      </div>
    </section>
  );
}
