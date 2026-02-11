'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as RechartLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGlobalTimeframe } from '@/lib/contexts/GlobalTimeframeContext';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import { endOfDay, startOfWeek, type TimeframeKey } from '@/lib/dates';
import type { IncomeEntry } from '@/lib/income';
import type { OdometerEntry, OdometerUnit } from '@/lib/odometer';
import { getOdometerDistance } from '@/lib/odometer';

type IncomePerMileTrendWidgetProps = {
  incomes: IncomeEntry[];
  odometerEntries: OdometerEntry[];
  currency: CurrencyCode;
  odometerUnit: OdometerUnit;
};

type ChartView = 'daily' | 'weekly' | 'monthly';

type IncomePerMileDatum = {
  label: string;
  incomePerMile: number | null;
};

type Accumulator = {
  income: number;
  distance: number;
};

const UNIT_LABEL: Record<OdometerUnit, string> = {
  km: 'km',
  miles: 'mi',
};

const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const dayNumberFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
});

const shortMonthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
});

const shortMonthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const getDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const parseDayKey = (dayKey: string) => {
  const parsed = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const normalizeDayKey = (value: string) => {
  const maybeDay = value.includes('T') ? value.split('T')[0] : value;
  if (DAY_KEY_REGEX.test(maybeDay)) {
    return maybeDay;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return getDayKey(parsed);
};

const resolveView = (timeframe: TimeframeKey): ChartView => {
  switch (timeframe) {
    case 'today':
    case 'yesterday':
      return 'daily';
    case 'weekly':
      return 'weekly';
    default:
      return 'monthly';
  }
};

const getViewWindowLabel = (view: ChartView) => {
  switch (view) {
    case 'daily':
      return 'This month';
    case 'weekly':
      return 'Past 3 months';
    case 'monthly':
      return 'This year';
    default:
      return 'This year';
  }
};

const buildDailyData = (
  incomeByDay: Map<string, number>,
  distanceByDay: Map<string, number>,
  reference: Date,
) => {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: IncomePerMileDatum[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dayKey = getDayKey(date);
    const distance = distanceByDay.get(dayKey) ?? 0;
    const income = incomeByDay.get(dayKey) ?? 0;
    data.push({
      label: dayNumberFormatter.format(date),
      incomePerMile: distance > 0 ? income / distance : null,
    });
  }

  return data;
};

const buildWeeklyData = (
  incomeByDay: Map<string, number>,
  distanceByDay: Map<string, number>,
  reference: Date,
) => {
  const rangeStart = new Date(
    reference.getFullYear(),
    reference.getMonth() - 2,
    1,
  );
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = endOfDay(reference);
  const weekBuckets = new Map<string, Accumulator>();

  for (const [dayKey, distance] of distanceByDay.entries()) {
    const date = parseDayKey(dayKey);
    if (!date || date < rangeStart || date > rangeEnd) {
      continue;
    }

    const weekStart = startOfWeek(date);
    const weekKey = getDayKey(weekStart);
    const current = weekBuckets.get(weekKey) ?? { income: 0, distance: 0 };
    current.income += incomeByDay.get(dayKey) ?? 0;
    current.distance += distance;
    weekBuckets.set(weekKey, current);
  }

  const firstWeekStart = startOfWeek(rangeStart);
  const data: IncomePerMileDatum[] = [];

  for (
    const cursor = new Date(firstWeekStart);
    cursor <= rangeEnd;
    cursor.setDate(cursor.getDate() + 7)
  ) {
    const weekKey = getDayKey(cursor);
    const bucket = weekBuckets.get(weekKey);
    data.push({
      label: shortMonthDayFormatter.format(cursor),
      incomePerMile:
        bucket && bucket.distance > 0 ? bucket.income / bucket.distance : null,
    });
  }

  return data;
};

const buildMonthlyData = (
  incomeByDay: Map<string, number>,
  distanceByDay: Map<string, number>,
  reference: Date,
) => {
  const year = reference.getFullYear();
  const yearStart = new Date(year, 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
  const monthBuckets = new Map<number, Accumulator>();

  for (const [dayKey, distance] of distanceByDay.entries()) {
    const date = parseDayKey(dayKey);
    if (!date || date < yearStart || date > yearEnd) {
      continue;
    }

    const month = date.getMonth();
    const current = monthBuckets.get(month) ?? { income: 0, distance: 0 };
    current.income += incomeByDay.get(dayKey) ?? 0;
    current.distance += distance;
    monthBuckets.set(month, current);
  }

  return Array.from({ length: 12 }, (_, month): IncomePerMileDatum => {
    const date = new Date(year, month, 1);
    const bucket = monthBuckets.get(month);
    return {
      label: shortMonthFormatter.format(date),
      incomePerMile:
        bucket && bucket.distance > 0 ? bucket.income / bucket.distance : null,
    };
  });
};

export function IncomePerMileTrendWidget({
  incomes,
  odometerEntries,
  currency,
  odometerUnit,
}: IncomePerMileTrendWidgetProps) {
  const { timeframe, selectedOption, dateRange } = useGlobalTimeframe();
  const view = resolveView(timeframe);
  const unitLabel = UNIT_LABEL[odometerUnit];

  const incomeByDay = useMemo(() => {
    const totals = new Map<string, number>();
    for (const entry of incomes) {
      const dayKey = normalizeDayKey(entry.date);
      if (!dayKey) {
        continue;
      }
      totals.set(dayKey, (totals.get(dayKey) ?? 0) + entry.amount);
    }
    return totals;
  }, [incomes]);

  const distanceByDay = useMemo(() => {
    const totals = new Map<string, number>();
    for (const entry of odometerEntries) {
      const dayKey = normalizeDayKey(entry.date);
      if (!dayKey) {
        continue;
      }
      const distance = getOdometerDistance(entry);
      if (!Number.isFinite(distance) || distance <= 0) {
        continue;
      }
      totals.set(dayKey, (totals.get(dayKey) ?? 0) + distance);
    }
    return totals;
  }, [odometerEntries]);

  const chartData = useMemo(() => {
    const referenceDate = dateRange.end;

    switch (view) {
      case 'daily':
        return buildDailyData(incomeByDay, distanceByDay, referenceDate);
      case 'weekly':
        return buildWeeklyData(incomeByDay, distanceByDay, referenceDate);
      default:
        return buildMonthlyData(incomeByDay, distanceByDay, referenceDate);
    }
  }, [dateRange.end, distanceByDay, incomeByDay, view]);

  const chartMax = useMemo(() => {
    let max = 0;
    for (const row of chartData) {
      if (row.incomePerMile !== null) {
        max = Math.max(max, row.incomePerMile);
      }
    }
    return max;
  }, [chartData]);

  const hasData = chartData.some((row) => row.incomePerMile !== null);

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm overflow-hidden'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Income per {unitLabel}
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            {view} view · {getViewWindowLabel(view)} · {selectedOption.label}
          </p>
        </div>
      </div>
      <div className='mt-6'>
        <div className='h-60 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <RechartLineChart data={chartData}>
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
                  `${formatCurrency(Number(value), currency)}/${unitLabel}`
                }
                axisLine={false}
                tickLine={false}
                width={96}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(value) =>
                  `${formatCurrency(Number(value), currency)}/${unitLabel}`
                }
                labelFormatter={(label) => String(label)}
                contentStyle={{ fontSize: '12px' }}
              />
              <Line
                type='monotone'
                dataKey='incomePerMile'
                name={`Income/${unitLabel}`}
                stroke='#0EA5E9'
                strokeWidth={3}
                dot={{ r: 3, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </RechartLineChart>
          </ResponsiveContainer>
        </div>
        <div className='mt-3 flex items-center justify-between text-xs font-semibold text-base-content/60'>
          <span>{`${formatCurrency(0, currency)}/${unitLabel}`}</span>
          <span>{`${formatCurrency(chartMax, currency)}/${unitLabel}`}</span>
        </div>
        {!hasData && (
          <p className='mt-2 text-xs text-base-content/50'>
            Add odometer logs to plot income per {unitLabel}.
          </p>
        )}
      </div>
    </section>
  );
}
