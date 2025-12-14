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
import {
  formatCurrency,
  getPlatformDistribution,
  type IncomeEntry,
} from '@/lib/income';
import {
  getEntriesForTimeframe,
  type TimeframeKey,
  timeframeOptions,
} from '../_lib/platformBreakdownTimeframes';

type PlatformBreakdownPieChart = {
  incomes: IncomeEntry[];
  currency: CurrencyCode;
};

const TIMEFRAME_STORAGE_KEY = 'dashboard-pie-chart-timeframe';

const palette = [
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#F43F5E',
  '#0EA5E9',
  '#EAB308',
];

export function PlatformBreakdownPieChart({
  incomes,
  currency,
}: PlatformBreakdownPieChart) {
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
                  formatter={(value) => formatCurrency(Number(value), currency)}
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
                {formatCurrency(item.amount, currency)}
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
