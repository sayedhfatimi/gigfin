'use client';

import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';

type TodaySnapshotProps = {
  todayIncome: number;
  todayExpenses: number;
  todayNet: number;
  yesterdayNet: number;
  todayIncomeCount: number;
  todayExpenseCount: number;
  currency: CurrencyCode;
};

const formatPercent = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+∞' : current < 0 ? '-∞' : '—';
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(0)}%`;
};

const getTrendIcon = (current: number, previous: number): string => {
  if (current > previous) return 'fa-arrow-trend-up';
  if (current < previous) return 'fa-arrow-trend-down';
  return 'fa-minus';
};

const getTrendColor = (current: number, previous: number): string => {
  if (current > previous) return 'text-success';
  if (current < previous) return 'text-error';
  return 'text-base-content/60';
};

export function TodaySnapshotWidget({
  todayIncome,
  todayExpenses,
  todayNet,
  yesterdayNet,
  todayIncomeCount,
  todayExpenseCount,
  currency,
}: TodaySnapshotProps) {
  const profitMargin =
    todayIncome === 0 ? null : (todayNet / todayIncome) * 100;
  const percentChange = formatPercent(todayNet, yesterdayNet);
  const trendIcon = getTrendIcon(todayNet, yesterdayNet);
  const trendColor = getTrendColor(todayNet, yesterdayNet);

  return (
    <section className='border-2 border-primary/20 bg-linear-to-br from-primary/5 via-base-100 to-secondary/5 p-6 shadow-lg md:col-span-2 overflow-hidden'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-bold text-base-content flex items-center gap-2'>
            <span className='fa-solid fa-sun text-warning' aria-hidden='true' />
            Today's Snapshot
          </h2>
          <p className='text-sm text-base-content/60'>
            Real-time performance summary
          </p>
        </div>
        <div
          className={`badge badge-lg gap-2 ${
            todayNet >= 0 ? 'badge-success' : 'badge-error'
          }`}
        >
          <span className={`fa-solid ${trendIcon}`} aria-hidden='true' />
          <span>{percentChange} vs yesterday</span>
        </div>
      </div>

      <div className='mt-6 grid gap-4 sm:grid-cols-3'>
        {/* Today's Income */}
        <article className='rounded-xl border border-success/20 bg-success/5 p-4 transition hover:shadow-md'>
          <div className='flex items-center gap-2 text-success'>
            <span
              className='fa-solid fa-arrow-down-to-line'
              aria-hidden='true'
            />
            <p className='text-xs font-semibold uppercase'>Earned Today</p>
          </div>
          <p className='mt-2 text-3xl font-bold text-success'>
            {formatCurrency(todayIncome, currency)}
          </p>
          <p className='text-xs text-base-content/60'>
            {todayIncomeCount} {todayIncomeCount === 1 ? 'entry' : 'entries'}{' '}
            logged
          </p>
        </article>

        {/* Today's Expenses */}
        <article className='rounded-xl border border-error/20 bg-error/5 p-4 transition hover:shadow-md'>
          <div className='flex items-center gap-2 text-error'>
            <span
              className='fa-solid fa-arrow-up-from-line'
              aria-hidden='true'
            />
            <p className='text-xs font-semibold uppercase'>Spent Today</p>
          </div>
          <p className='mt-2 text-3xl font-bold text-error'>
            {formatCurrency(todayExpenses, currency)}
          </p>
          <p className='text-xs text-base-content/60'>
            {todayExpenseCount}{' '}
            {todayExpenseCount === 1 ? 'expense' : 'expenses'}
          </p>
        </article>

        {/* Net Profit */}
        <article
          className={`rounded-xl border p-4 transition hover:shadow-md ${
            todayNet >= 0
              ? 'border-primary/20 bg-primary/5'
              : 'border-warning/20 bg-warning/5'
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              todayNet >= 0 ? 'text-primary' : 'text-warning'
            }`}
          >
            <span className='fa-solid fa-wallet' aria-hidden='true' />
            <p className='text-xs font-semibold uppercase'>Net Today</p>
          </div>
          <p
            className={`mt-2 text-3xl font-bold ${
              todayNet >= 0 ? 'text-primary' : 'text-warning'
            }`}
          >
            {formatCurrency(todayNet, currency)}
          </p>
          <p className='text-xs text-base-content/60'>
            {profitMargin !== null
              ? `${profitMargin.toFixed(0)}% margin`
              : 'No income yet'}
          </p>
        </article>
      </div>

      {/* Quick comparison bar */}
      <div className='mt-4 flex items-center gap-4 text-xs'>
        <span className='text-base-content/60'>Yesterday:</span>
        <span className={`font-semibold ${trendColor}`}>
          {formatCurrency(yesterdayNet, currency)}
        </span>
        <span
          className={`fa-solid ${trendIcon} ${trendColor}`}
          aria-hidden='true'
        />
        <span className={`font-semibold ${trendColor}`}>{percentChange}</span>
      </div>
    </section>
  );
}
