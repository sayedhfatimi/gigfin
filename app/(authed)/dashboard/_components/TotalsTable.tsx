'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import {
  formatCurrency,
  getMonthlyTotals,
  type IncomeEntry,
} from '@/lib/income';

type TotalsTableProps = {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  currency: CurrencyCode;
};

type TotalsTimeframe = 'months' | 'weeks' | 'days';

type TotalsOption = {
  value: TotalsTimeframe;
  label: string;
};

const timeframeOptions: TotalsOption[] = [
  {
    value: 'months',
    label: 'Last 6 months',
  },
  {
    value: 'weeks',
    label: 'Last 6 weeks',
  },
  {
    value: 'days',
    label: 'Last 6 days',
  },
];

const STORAGE_KEY = 'dashboard-totals-table-timeframe';

type TotalsSummary = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const normalizeStartOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const normalizeEndOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

type NormalizedEntry = {
  date: Date;
  amount: number;
};

const parseDateValue = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const parseIncomeEntryDate = (entry: IncomeEntry) => parseDateValue(entry.date);
const parseExpenseEntryDate = (entry: ExpenseEntry) =>
  parseDateValue(entry.paidAt);

const normalizeIncomeEntries = (entries: IncomeEntry[]): NormalizedEntry[] =>
  entries
    .map((entry) => {
      const parsed = parseIncomeEntryDate(entry);
      if (!parsed) {
        return null;
      }
      return { date: parsed, amount: entry.amount };
    })
    .filter((entry): entry is NormalizedEntry => entry !== null);

const normalizeExpenseEntries = (entries: ExpenseEntry[]): NormalizedEntry[] =>
  entries
    .map((entry) => {
      const parsed = parseExpenseEntryDate(entry);
      if (!parsed) {
        return null;
      }
      return { date: parsed, amount: entry.amountMinor / 100 };
    })
    .filter((entry): entry is NormalizedEntry => entry !== null);

const getWeekStart = (date: Date) => {
  const normalized = new Date(date);
  const offset = (normalized.getDay() + 6) % 7;
  normalized.setDate(normalized.getDate() - offset);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const aggregateBetween = (
  entries: NormalizedEntry[],
  start: Date,
  end: Date,
  getKey: (entryDate: Date) => string,
) => {
  const totals = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.date < start || entry.date > end) {
      return;
    }
    const key = getKey(entry.date);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  });
  return totals;
};

const buildDailyTotals = (
  incomeEntries: NormalizedEntry[],
  expenseEntries: NormalizedEntry[],
  days: number,
  reference = new Date(),
): TotalsSummary[] => {
  const end = normalizeEndOfDay(reference);
  const start = normalizeStartOfDay(end);
  start.setDate(start.getDate() - (days - 1));

  const incomeTotals = aggregateBetween(
    incomeEntries,
    start,
    end,
    formatDateKey,
  );
  const expenseTotals = aggregateBetween(
    expenseEntries,
    start,
    end,
    formatDateKey,
  );

  const data: TotalsSummary[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const current = new Date(end);
    current.setDate(end.getDate() - offset);
    const key = formatDateKey(current);
    data.push({
      key,
      label: weekdayFormatter.format(current),
      income: incomeTotals.get(key) ?? 0,
      expense: expenseTotals.get(key) ?? 0,
    });
  }
  return data;
};

const buildWeeklyTotals = (
  incomeEntries: NormalizedEntry[],
  expenseEntries: NormalizedEntry[],
  weeks: number,
  reference = new Date(),
): TotalsSummary[] => {
  const end = normalizeEndOfDay(reference);
  const currentWeekStart = getWeekStart(reference);
  const earliestWeekStart = new Date(currentWeekStart);
  earliestWeekStart.setDate(currentWeekStart.getDate() - (weeks - 1) * 7);

  const incomeTotals = aggregateBetween(
    incomeEntries,
    earliestWeekStart,
    end,
    (date) => getWeekStart(date).toISOString(),
  );
  const expenseTotals = aggregateBetween(
    expenseEntries,
    earliestWeekStart,
    end,
    (date) => getWeekStart(date).toISOString(),
  );

  const data: TotalsSummary[] = [];
  for (let offset = 0; offset < weeks; offset += 1) {
    const targetWeekStart = new Date(currentWeekStart);
    targetWeekStart.setDate(currentWeekStart.getDate() - offset * 7);
    const key = targetWeekStart.toISOString();
    data.push({
      key,
      label: `Week of ${dayFormatter.format(targetWeekStart)}`,
      income: incomeTotals.get(key) ?? 0,
      expense: expenseTotals.get(key) ?? 0,
    });
  }
  return data;
};

const buildMonthlyTotals = (
  incomeEntries: IncomeEntry[],
  expenseEntries: NormalizedEntry[],
) => {
  const incomeSummaries = getMonthlyTotals(incomeEntries, 6);
  const expenseTotals = new Map<string, number>();
  expenseEntries.forEach((entry) => {
    const key = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
    expenseTotals.set(key, (expenseTotals.get(key) ?? 0) + entry.amount);
  });

  return incomeSummaries.map((summary) => {
    const key = `${summary.year}-${summary.month}`;
    return {
      key,
      label: summary.label,
      income: summary.total,
      expense: expenseTotals.get(key) ?? 0,
    };
  });
};

const getTotalsForTimeframe = (
  timeframe: TotalsTimeframe,
  incomeEntries: IncomeEntry[],
  expenseEntries: ExpenseEntry[],
) => {
  const normalizedIncome = normalizeIncomeEntries(incomeEntries);
  const normalizedExpense = normalizeExpenseEntries(expenseEntries);
  switch (timeframe) {
    case 'weeks':
      return buildWeeklyTotals(normalizedIncome, normalizedExpense, 6);
    case 'days':
      return buildDailyTotals(normalizedIncome, normalizedExpense, 6);
    default:
      return buildMonthlyTotals(incomeEntries, normalizedExpense);
  }
};

export function TotalsTable({ incomes, expenses, currency }: TotalsTableProps) {
  const [timeframe, setTimeframe] = useState<TotalsTimeframe>('months');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && timeframeOptions.some((option) => option.value === stored)) {
      setTimeframe(stored as TotalsTimeframe);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, timeframe);
  }, [timeframe]);

  const selectedOption =
    timeframeOptions.find((option) => option.value === timeframe) ??
    timeframeOptions[0];

  const totalsData = useMemo(
    () => getTotalsForTimeframe(timeframe, incomes, expenses),
    [incomes, expenses, timeframe],
  );

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>Totals</h2>
          <p className='text-xs uppercase text-base-content/60'>
            {selectedOption.label}
          </p>
        </div>
        <div className='flex items-end gap-2'>
          <label className='select select-xs'>
            <span className='label hidden md:block'>Timeframe</span>
            <select
              id='totals-table-timeframe'
              value={timeframe}
              onChange={(event) =>
                setTimeframe(event.target.value as TotalsTimeframe)
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
      <div className='mt-4 overflow-x-auto'>
        <table className='table w-full table-zebra'>
          <thead>
            <tr>
              <th className='text-left text-xs uppercase text-base-content/50'>
                Period
              </th>
              <th className='text-left text-xs uppercase text-base-content/50'>
                Income
              </th>
              <th className='text-left text-xs uppercase text-base-content/50'>
                Expenses
              </th>
              <th className='text-left text-xs uppercase text-base-content/50'>
                Net
              </th>
            </tr>
          </thead>
          <tbody>
            {totalsData.map((summary, index) => (
              <tr
                key={summary.key}
                className={index === 0 ? 'font-semibold text-base-content' : ''}
              >
                <td>{summary.label}</td>
                <td className='font-semibold text-base-content'>
                  {formatCurrency(summary.income, currency)}
                </td>
                <td className='font-semibold text-base-content'>
                  {formatCurrency(summary.expense, currency)}
                </td>
                <td
                  className={`font-semibold ${
                    summary.income - summary.expense >= 0
                      ? 'text-success'
                      : 'text-error'
                  }`}
                >
                  {formatCurrency(summary.income - summary.expense, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
