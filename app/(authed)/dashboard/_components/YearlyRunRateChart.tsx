'use client';

import { useMemo } from 'react';
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
import {
  formatCurrency,
  getYearlyMonthlyTotals,
  type IncomeEntry,
} from '@/lib/income';

type YearlyRunRateChartProps = {
  incomes: IncomeEntry[];
  currency: CurrencyCode;
};

export function YearlyRunRateChart({
  incomes,
  currency,
}: YearlyRunRateChartProps) {
  const chartData = useMemo(() => getYearlyMonthlyTotals(incomes), [incomes]);
  const hasData = chartData.some((row) => row.total > 0);
  const peakAmount = useMemo(
    () =>
      chartData.length ? Math.max(...chartData.map((row) => row.total)) : 0,
    [chartData],
  );

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
        <p className='text-xs text-base-content/60'>
          Peak {formatCurrency(peakAmount, currency)}
        </p>
      </div>
      <div className='mt-6 h-52 w-full'>
        {hasData ? (
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
              <Bar dataKey='total' radius={[4, 4, 0, 0]} fill='#6366F1' />
            </RechartBarChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-full items-center justify-center rounded border border-dashed border-base-content/20 text-xs text-base-content/50'>
            No income logged yet to build a yearly run rate
          </div>
        )}
      </div>
    </section>
  );
}
