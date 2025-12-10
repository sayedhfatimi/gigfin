'use client';

import { useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
import {
  aggregateDailyIncomes,
  formatMonthShortLabel,
  getCurrentMonthEntries,
  getMonthlyTotals,
  getPlatformDistribution,
  getYearlyMonthlyTotals,
} from '@/lib/income';
import { useIncomeLogs } from '@/lib/queries/income';
import { getSessionUser } from '@/lib/session';
import { DashboardStats } from './_components/DashboardStats';
import { MonthlyTotalsTable } from './_components/MonthlyTotalsTable';
import { PieChart } from './_components/PieChart';
import { RecentDaysPanel } from './_components/RecentDaysPanel';
import { YearlyTrendChart } from './_components/YearlyTrendChart';

export default function DashboardPage() {
  const { data: sessionData, isPending } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const { data: incomes = [] } = useIncomeLogs();

  const dailySummaries = useMemo(
    () => aggregateDailyIncomes(incomes),
    [incomes],
  );
  const totalIncome = useMemo(
    () => incomes.reduce((acc, row) => acc + row.amount, 0),
    [incomes],
  );
  const currentMonthEntries = useMemo(
    () => getCurrentMonthEntries(incomes),
    [incomes],
  );
  const platformDistribution = useMemo(
    () => getPlatformDistribution(currentMonthEntries),
    [currentMonthEntries],
  );
  const currentMonthTotal = useMemo(
    () => currentMonthEntries.reduce((acc, row) => acc + row.amount, 0),
    [currentMonthEntries],
  );
  const monthlyTotals = useMemo(() => getMonthlyTotals(incomes, 6), [incomes]);
  const averagePerDay = dailySummaries.length
    ? totalIncome / dailySummaries.length
    : 0;
  const currentMonthLabel = monthlyTotals[0]?.label ?? 'Current month';
  const yearlyTotals = useMemo(
    () => getYearlyMonthlyTotals(incomes),
    [incomes],
  );
  const yearlyChartData = useMemo(
    () =>
      yearlyTotals.map((row) => ({
        label: formatMonthShortLabel(row.year, row.month),
        total: row.total,
      })),
    [yearlyTotals],
  );
  const yearlyChartMax = useMemo(() => {
    if (!yearlyTotals.length) {
      return 0;
    }
    return Math.max(...yearlyTotals.map((row) => row.total));
  }, [yearlyTotals]);
  const currentYear = yearlyTotals[0]?.year ?? new Date().getFullYear();

  if (isPending) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <div className='loading loading-dots loading-lg'>Loading stats…</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <header className='space-y-1'>
        <p className='text-xs uppercase text-base-content/60'>Dashboard</p>
        <h1 className='text-3xl font-semibold text-base-content'>
          Welcome back,{' '}
          {sessionUser?.name ?? sessionUser?.email ?? 'gig worker'}
        </h1>
        <p className='text-sm text-base-content/60'>
          Track income, spot trends, and level up your earnings.
        </p>
      </header>

      <DashboardStats
        totalIncome={totalIncome}
        averagePerDay={averagePerDay}
        platformCount={platformDistribution.length}
        currentMonthLabel={currentMonthLabel}
        currentMonthTotal={currentMonthTotal}
        currentMonthEntriesCount={currentMonthEntries.length}
        trackedDaysCount={dailySummaries.length}
      />

      <div className='grid gap-6 lg:grid-cols-[1.4fr_1fr]'>
        <RecentDaysPanel dailySummaries={dailySummaries} />
        <PieChart incomes={incomes} />
      </div>

      <YearlyTrendChart
        yearlyChartData={yearlyChartData}
        currentYear={currentYear}
        yearlyChartMax={yearlyChartMax}
      />

      <MonthlyTotalsTable monthlyTotals={monthlyTotals} />
    </div>
  );
}
