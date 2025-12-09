'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/income';

type YearlyTrendChartDatum = {
  label: string;
  total: number;
};

type YearlyTrendChartProps = {
  yearlyChartData: YearlyTrendChartDatum[];
  currentYear: number;
  yearlyChartMax: number;
};

export function YearlyTrendChart({
  yearlyChartData,
  currentYear,
  yearlyChartMax,
}: YearlyTrendChartProps) {
  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Yearly income trend
          </h2>
          <p className='text-xs uppercase  text-base-content/60'>
            Month over month
          </p>
        </div>
        <p className='text-xs uppercase  text-base-content/50'>{currentYear}</p>
      </div>
      <div className='mt-6'>
        <div className='h-60 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={yearlyChartData}>
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
                tickFormatter={(value) => formatCurrency(Number(value))}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
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
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className='mt-3 flex items-center justify-between text-xs font-semibold text-base-content/60'>
          <span>{formatCurrency(0)}</span>
          <span>{formatCurrency(yearlyChartMax)}</span>
        </div>
      </div>
    </section>
  );
}
