'use client';

import { useMemo } from 'react';
import type { DailyIncomeSummary } from '@/lib/income';

type DailyCadencePanelProps = {
  dailySummaries: DailyIncomeSummary[];
};

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const normalizeDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export function DailyCadencePanel({ dailySummaries }: DailyCadencePanelProps) {
  const uniqueDates = useMemo(() => {
    const dates = dailySummaries
      .map((summary) => normalizeDate(summary.date))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => a.getTime() - b.getTime());
    const seen = new Set<string>();
    const filtered: Date[] = [];
    dates.forEach((date) => {
      const key = date.toISOString();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      filtered.push(date);
    });
    return filtered;
  }, [dailySummaries]);

  const longestStreak = useMemo(() => {
    let streak = 0;
    let best = 0;
    let previous: Date | null = null;
    uniqueDates.forEach((date) => {
      if (previous) {
        const diff = Math.round(
          (date.getTime() - previous.getTime()) / ONE_DAY_MS,
        );
        streak = diff === 1 ? streak + 1 : 1;
      } else {
        streak = 1;
      }
      previous = date;
      best = Math.max(best, streak);
    });
    return best;
  }, [uniqueDates]);

  const daysThisWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    return uniqueDates.filter(
      (date) =>
        date.getTime() >= weekStart.getTime() &&
        date.getTime() <= today.getTime(),
    ).length;
  }, [uniqueDates]);

  const totalLoggedDays = uniqueDates.length;

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Daily cadence
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            Logging momentum
          </p>
        </div>
        <span className='text-xs text-base-content/60'>
          {totalLoggedDays} day{totalLoggedDays === 1 ? '' : 's'} tracked
        </span>
      </div>
      <div className='mt-6 grid grid-cols-2 gap-4'>
        <div className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <p className='text-xs uppercase text-base-content/60'>Past 7 days</p>
          <p className='text-3xl font-semibold text-base-content'>
            {daysThisWeek}/7
          </p>
          <p className='text-xs text-base-content/50'>
            Days with income logged
          </p>
        </div>
        <div className='rounded-lg border border-base-content/10 bg-base-200/50 p-4'>
          <p className='text-xs uppercase text-base-content/60'>
            Longest streak
          </p>
          <p className='text-3xl font-semibold text-base-content'>
            {longestStreak}
          </p>
          <p className='text-xs text-base-content/50'>
            Consecutive days logged
          </p>
        </div>
      </div>
    </section>
  );
}
