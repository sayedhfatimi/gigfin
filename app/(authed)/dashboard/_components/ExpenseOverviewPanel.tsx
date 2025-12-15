'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import { type ExpenseEntry, formatExpenseType } from '@/lib/expenses';
import { getExpenseEntriesForTimeframe } from '../_lib/expenseBreakdownTimeframes';
import {
  type TimeframeKey,
  timeframeOptions,
} from '../_lib/platformBreakdownTimeframes';

type ExpenseOverviewPanelProps = {
  expenses: ExpenseEntry[];
  currency: CurrencyCode;
};

const TIMEFRAME_STORAGE_KEY = 'expense-overview-timeframe';

export function ExpenseOverviewPanel({
  expenses,
  currency,
}: ExpenseOverviewPanelProps) {
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

  const timeframeExpenses = useMemo(
    () => getExpenseEntriesForTimeframe(expenses, timeframe),
    [expenses, timeframe],
  );

  const totalExpenses = useMemo(
    () =>
      timeframeExpenses.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [timeframeExpenses],
  );

  const trackedDays = useMemo(
    () =>
      new Set(timeframeExpenses.map((entry) => entry.paidAt.split('T')[0]))
        .size,
    [timeframeExpenses],
  );

  const averagePerDay = trackedDays ? totalExpenses / trackedDays : 0;

  const categoryDistribution = useMemo(() => {
    const totals = new Map<string, number>();
    timeframeExpenses.forEach((entry) => {
      const amount = entry.amountMinor / 100;
      totals.set(
        entry.expenseType,
        (totals.get(entry.expenseType) ?? 0) + amount,
      );
    });
    return Array.from(totals.entries())
      .map(([expenseType, amount]) => ({
        expenseType,
        amount,
        percentage: totalExpenses ? amount / totalExpenses : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [timeframeExpenses, totalExpenses]);

  const hasExpenses = timeframeExpenses.length > 0;

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Spend overview
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            {selectedOption.label} · {selectedOption.description}
          </p>
        </div>
        <label className='select select-xs max-w-fit'>
          <span className='label hidden md:block'>Timeframe</span>
          <select
            id='expense-overview-timeframe'
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
      {hasExpenses ? (
        <div className='mt-6 space-y-6'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='rounded border border-base-content/10 bg-base-100 p-4 shadow-sm'>
              <p className='text-xs uppercase text-base-content/60'>
                Total expenses
              </p>
              <p className='text-3xl font-semibold text-error'>
                {formatCurrency(totalExpenses, currency)}
              </p>
              <p className='text-xs text-base-content/50'>
                {timeframeExpenses.length} entries logged
              </p>
            </div>
            <div className='rounded border border-base-content/10 bg-base-100 p-4 shadow-sm'>
              <p className='text-xs uppercase text-base-content/60'>
                Average / day
              </p>
              <p className='text-3xl font-semibold text-base-content'>
                {formatCurrency(averagePerDay, currency)}
              </p>
              <p className='text-xs text-base-content/50'>
                {trackedDays} day{trackedDays === 1 ? '' : 's'} tracked
              </p>
            </div>
          </div>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-xs uppercase text-base-content/60'>
                Top categories
              </p>
              <span className='text-xs text-base-content/50'>
                {categoryDistribution.length} tracked
              </span>
            </div>
            <div className='space-y-2 rounded border border-base-content/10 bg-base-100 p-3'>
              {categoryDistribution.slice(0, 3).map((category) => (
                <div
                  key={category.expenseType}
                  className='flex items-center justify-between text-sm'
                >
                  <div>
                    <p className='font-semibold text-base-content'>
                      {formatExpenseType(category.expenseType)}
                    </p>
                    <p className='text-xs text-base-content/50'>
                      {(category.percentage * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className='font-semibold text-base-content'>
                    {formatCurrency(category.amount, currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className='mt-6 text-sm text-base-content/60'>
          No expenses logged for {selectedOption.label} yet. Record an entry in
          Logs to start analysing spend.
        </p>
      )}
    </section>
  );
}
