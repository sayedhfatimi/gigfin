'use client';

import { DailyIncomeSummary, formatCurrency } from '@/lib/income';

type RecentDaysPanelProps = {
  dailySummaries: DailyIncomeSummary[];
};

export function RecentDaysPanel({ dailySummaries }: RecentDaysPanelProps) {
  const recentDays = dailySummaries.slice(0, 3);

  return (
    <section className='space-y-4  border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-base-content'>Recent days</h2>
        <p className='text-xs uppercase tracking-[0.4em] text-base-content/50'>
          totals
        </p>
      </div>
      {recentDays.length ? (
        <div className='space-y-4'>
          {recentDays.map((day) => (
            <div
              key={day.date}
              className='flex items-center justify-between'
            >
              <div>
                <p className='font-semibold'>{day.date}</p>
                <p className='text-xs text-base-content/50'>
                  {day.breakdown.length} platform
                  {day.breakdown.length === 1 ? '' : 's'}
                </p>
              </div>
              <p className='font-semibold text-base-content'>
                {formatCurrency(day.total)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-sm text-base-content/60'>
          No income logged yet. Head over to Logs to add your first entry.
        </p>
      )}
    </section>
  );
}
