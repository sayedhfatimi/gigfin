'use client';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatCurrency } from '@/lib/income';

type PlatformDistributionItem = {
  platform: string;
  amount: number;
};

type PieChartDatum = {
  name: string;
  value: number;
};

type PlatformBreakdownProps = {
  platformDistribution: PlatformDistributionItem[];
  pieChartData: PieChartDatum[];
};

const palette = [
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#F43F5E',
  '#0EA5E9',
  '#EAB308',
];

export function PlatformBreakdown({
  platformDistribution,
  pieChartData,
}: PlatformBreakdownProps) {
  return (
    <section className=' border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-base-content'>
          Platform breakdown
        </h2>
        <p className='text-xs uppercase tracking-[0.4em] text-base-content/50'>
          Pie
        </p>
      </div>
      <div className='mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center'>
        <div className='h-44 w-full'>
          {pieChartData.length ? (
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
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
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex h-full items-center justify-center rounded-full border border-dashed border-base-content/20 text-xs text-base-content/50'>
              No platform data yet
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
              Start adding logs on the Logs tab to build up your insights.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
