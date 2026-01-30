'use client';

import { useMemo } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { resolveCurrency } from '@/lib/currency';
import {
  endOfDay,
  isInRange,
  parseDate,
  startOfDay,
  subtractDays,
} from '@/lib/dates';
import type { ExpenseEntry } from '@/lib/expenses';
import { getCurrentMonthExpenses } from '@/lib/expenses';
import type { DailyIncomeSummary, IncomeEntry } from '@/lib/income';
import {
  aggregateDailyIncomes,
  formatCurrency,
  getCurrentMonthEntries,
  getPlatformDistribution,
} from '@/lib/income';
import type { OdometerEntry, OdometerUnit } from '@/lib/odometer';
import { useExpenseLogs } from '@/lib/queries/expenses';
import { useIncomeLogs } from '@/lib/queries/income';
import { useOdometerLogs } from '@/lib/queries/odometers';

export type DashboardStat = {
  title: string;
  value: string;
  desc: string;
  valueClass?: string;
};

export type DashboardData = {
  // Raw data
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  odometerEntries: OdometerEntry[];

  // Loading states
  isLoading: boolean;
  isIncomeLoading: boolean;
  isExpenseLoading: boolean;

  // User preferences
  currency: CurrencyCode;
  odometerUnit: OdometerUnit;

  // Aggregated data
  dailySummaries: DailyIncomeSummary[];
  totalIncome: number;
  totalExpenses: number;
  trackedDaysCount: number;
  averagePerDay: number;

  // Current month data
  currentMonthEntries: IncomeEntry[];
  currentMonthExpenses: ExpenseEntry[];
  currentMonthTotal: number;
  currentMonthExpenseTotal: number;
  currentMonthEntriesCount: number;
  currentMonthExpenseCount: number;

  // Platform distribution
  platformDistribution: ReturnType<typeof getPlatformDistribution>;

  // Today's data
  todayIncome: number;
  todayExpenses: number;
  todayNet: number;
  todayIncomeCount: number;
  todayExpenseCount: number;

  // Yesterday's data (for comparison)
  yesterdayIncome: number;
  yesterdayExpenses: number;
  yesterdayNet: number;

  // Computed stats
  stats: DashboardStat[];

  // Profit metrics
  netProfit: number;
  profitMargin: number | null;
  expenseRatio: number | null;
};

type UseDashboardDataOptions = {
  sessionUser?: {
    currency?: unknown;
    odometerUnit?: unknown;
    [key: string]: unknown;
  } | null;
};

/**
 * Centralized hook for all dashboard data fetching and aggregation
 */
export function useDashboardData(
  options: UseDashboardDataOptions = {},
): DashboardData {
  const { sessionUser } = options;

  const currency = resolveCurrency(
    sessionUser?.currency as string | undefined,
  ) as CurrencyCode;
  const odometerUnit = (
    sessionUser?.odometerUnit === 'miles' ? 'miles' : 'km'
  ) as OdometerUnit;

  const { data: incomes = [], isPending: isIncomeLoading } = useIncomeLogs();
  const { data: expenses = [], isPending: isExpenseLoading } = useExpenseLogs();
  const { data: odometerEntries = [], isPending: isOdometerLoading } =
    useOdometerLogs();

  const isLoading = isIncomeLoading || isExpenseLoading || isOdometerLoading;

  // Daily summaries
  const dailySummaries = useMemo(
    () => aggregateDailyIncomes(incomes),
    [incomes],
  );

  // Total income
  const totalIncome = useMemo(
    () => incomes.reduce((acc, row) => acc + row.amount, 0),
    [incomes],
  );

  // Total expenses
  const totalExpenses = useMemo(
    () => expenses.reduce((acc, entry) => acc + entry.amountMinor / 100, 0),
    [expenses],
  );

  // Current month entries
  const currentMonthEntries = useMemo(
    () => getCurrentMonthEntries(incomes),
    [incomes],
  );

  // Current month expenses
  const currentMonthExpenses = useMemo(
    () => getCurrentMonthExpenses(expenses),
    [expenses],
  );

  // Platform distribution for current month
  const platformDistribution = useMemo(
    () => getPlatformDistribution(currentMonthEntries),
    [currentMonthEntries],
  );

  // Current month totals
  const currentMonthTotal = useMemo(
    () => currentMonthEntries.reduce((acc, row) => acc + row.amount, 0),
    [currentMonthEntries],
  );

  const currentMonthExpenseTotal = useMemo(
    () =>
      currentMonthExpenses.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [currentMonthExpenses],
  );

  const currentMonthEntriesCount = currentMonthEntries.length;
  const currentMonthExpenseCount = currentMonthExpenses.length;
  const trackedDaysCount = dailySummaries.length;
  const averagePerDay = trackedDaysCount ? totalIncome / trackedDaysCount : 0;

  // Today's data
  const today = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => startOfDay(today), [today]);
  const todayEnd = useMemo(() => endOfDay(today), [today]);

  const todayIncomes = useMemo(
    () =>
      incomes.filter((entry) => {
        const date = parseDate(entry.date);
        return date && isInRange(date, todayStart, todayEnd);
      }),
    [incomes, todayStart, todayEnd],
  );

  const todayExpenseEntries = useMemo(
    () =>
      expenses.filter((entry) => {
        const date = parseDate(entry.paidAt);
        return date && isInRange(date, todayStart, todayEnd);
      }),
    [expenses, todayStart, todayEnd],
  );

  const todayIncome = useMemo(
    () => todayIncomes.reduce((acc, row) => acc + row.amount, 0),
    [todayIncomes],
  );

  const todayExpenses = useMemo(
    () =>
      todayExpenseEntries.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [todayExpenseEntries],
  );

  const todayNet = todayIncome - todayExpenses;
  const todayIncomeCount = todayIncomes.length;
  const todayExpenseCount = todayExpenseEntries.length;

  // Yesterday's data
  const yesterdayStart = useMemo(
    () => startOfDay(subtractDays(today, 1)),
    [today],
  );
  const yesterdayEnd = useMemo(() => endOfDay(subtractDays(today, 1)), [today]);

  const yesterdayIncomes = useMemo(
    () =>
      incomes.filter((entry) => {
        const date = parseDate(entry.date);
        return date && isInRange(date, yesterdayStart, yesterdayEnd);
      }),
    [incomes, yesterdayStart, yesterdayEnd],
  );

  const yesterdayExpenseEntries = useMemo(
    () =>
      expenses.filter((entry) => {
        const date = parseDate(entry.paidAt);
        return date && isInRange(date, yesterdayStart, yesterdayEnd);
      }),
    [expenses, yesterdayStart, yesterdayEnd],
  );

  const yesterdayIncome = useMemo(
    () => yesterdayIncomes.reduce((acc, row) => acc + row.amount, 0),
    [yesterdayIncomes],
  );

  const yesterdayExpenses = useMemo(
    () =>
      yesterdayExpenseEntries.reduce(
        (acc, entry) => acc + entry.amountMinor / 100,
        0,
      ),
    [yesterdayExpenseEntries],
  );

  const yesterdayNet = yesterdayIncome - yesterdayExpenses;

  // Profit metrics (current month)
  const netProfit = currentMonthTotal - currentMonthExpenseTotal;
  const profitMargin =
    currentMonthTotal === 0 ? null : netProfit / currentMonthTotal;
  const expenseRatio =
    currentMonthTotal === 0
      ? null
      : currentMonthExpenseTotal / currentMonthTotal;

  // Dashboard stats
  const stats = useMemo<DashboardStat[]>(() => {
    const trackedDaysLabel = `Across ${trackedDaysCount} ${
      trackedDaysCount === 1 ? 'day' : 'days'
    } tracked`;

    return [
      {
        title: 'Total income',
        value: formatCurrency(totalIncome, currency),
        desc: trackedDaysLabel,
        valueClass: 'text-primary',
      },
      {
        title: 'Average / day',
        value: formatCurrency(averagePerDay, currency),
        desc: 'Consistent hustle',
        valueClass: 'text-secondary',
      },
      {
        title: 'Total expenses',
        value: formatCurrency(totalExpenses, currency),
        desc: `${expenses.length} entries logged`,
        valueClass: 'text-error',
      },
      {
        title: 'Current month',
        value: formatCurrency(currentMonthTotal, currency),
        desc: `${currentMonthEntriesCount} entries logged`,
        valueClass: 'text-accent',
      },
    ];
  }, [
    totalIncome,
    averagePerDay,
    currentMonthTotal,
    currentMonthEntriesCount,
    trackedDaysCount,
    currency,
    totalExpenses,
    expenses.length,
  ]);

  return {
    // Raw data
    incomes,
    expenses,
    odometerEntries,

    // Loading states
    isLoading,
    isIncomeLoading,
    isExpenseLoading,

    // User preferences
    currency,
    odometerUnit,

    // Aggregated data
    dailySummaries,
    totalIncome,
    totalExpenses,
    trackedDaysCount,
    averagePerDay,

    // Current month data
    currentMonthEntries,
    currentMonthExpenses,
    currentMonthTotal,
    currentMonthExpenseTotal,
    currentMonthEntriesCount,
    currentMonthExpenseCount,

    // Platform distribution
    platformDistribution,

    // Today's data
    todayIncome,
    todayExpenses,
    todayNet,
    todayIncomeCount,
    todayExpenseCount,

    // Yesterday's data
    yesterdayIncome,
    yesterdayExpenses,
    yesterdayNet,

    // Computed stats
    stats,

    // Profit metrics
    netProfit,
    profitMargin,
    expenseRatio,
  };
}
