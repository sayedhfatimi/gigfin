'use client';

import { useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import { getExpenseEntriesForTimeframe } from '../_lib/expenseBreakdownTimeframes';
import {
  getEntriesForTimeframe,
  timeframeOptions,
} from '../_lib/platformBreakdownTimeframes';

type ProfitabilityPanelProps = {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  currency: CurrencyCode;
};

type TimeframeKey = 'weekly' | 'monthly' | 'yearToDate' | 'last12Months';

const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  return `${(value * 100).toFixed(1)}%`;
};

export function ProfitabilityPanel({
  incomes,
  expenses,
  currency,
}: ProfitabilityPanelProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('monthly');
  const selectedOption =
    timeframeOptions.find((option) => option.value === timeframe) ??
    timeframeOptions[1];

  const timeframeIncomes = useMemo(
    () => getEntriesForTimeframe(incomes, timeframe),
    [incomes, timeframe],
  );
  const timeframeExpenses = useMemo(
    () => getExpenseEntriesForTimeframe(expenses, timeframe),
    [expenses, timeframe],
  );
  const totalIncome = useMemo(
    () => timeframeIncomes.reduce((acc, entry) => acc + entry.amount, 0),
    [timeframeIncomes],
  );
  const totalExpenses = useMemo(
    () =>
      timeframeExpenses.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [timeframeExpenses],
  );

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome === 0 ? null : netProfit / totalIncome;
  const expenseRatio = totalIncome === 0 ? null : totalExpenses / totalIncome;
  const statusIcon = netProfit >= 0 ? 'arrow-trend-up' : 'arrow-trend-down';

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex gap-2 flex-row items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Profitability
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            KPIs · {selectedOption.label} · {selectedOption.description}
          </p>
        </div>
        <div className='flex flex-col md:flex-row md:items-center items-end gap-4'>
          <label className='select select-xs max-w-fit'>
            <span className='label hidden md:block'>Timeframe</span>
            <select
              id='profitability-timeframe'
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
          <span
            className={`badge badge-sm ${
              netProfit >= 0
                ? 'badge-success text-success-content'
                : 'badge-error text-error-content'
            }`}
          >
            <i className={`fa-solid fa-${statusIcon}`} />
          </span>
        </div>
      </div>
      <div className='mt-6 grid gap-4 sm:grid-cols-3'>
        <article className='rounded border border-base-content/10 bg-base-100 p-4 shadow-sm'>
          <p className='text-xs uppercase text-base-content/60'>Net profit</p>
          <p className='text-3xl font-semibold text-base-content'>
            {formatCurrency(netProfit, currency)}
          </p>
          <p className='text-xs text-base-content/50'>{selectedOption.label}</p>
        </article>
        <article className='rounded border border-base-content/10 bg-base-100 p-4 shadow-sm'>
          <p className='text-xs uppercase text-base-content/60'>
            Profit margin
          </p>
          <p className='text-3xl font-semibold text-green-600'>
            {formatPercent(profitMargin)}
          </p>
          <p className='text-xs text-base-content/50'>% of income</p>
        </article>
        <article className='rounded border border-base-content/10 bg-base-100 p-4 shadow-sm'>
          <p className='text-xs uppercase text-base-content/60'>
            Expense ratio
          </p>
          <p className='text-3xl font-semibold text-accent'>
            {formatPercent(expenseRatio)}
          </p>
          <p className='text-xs text-base-content/50'>% of income</p>
        </article>
      </div>
    </section>
  );
}
