'use client';

import { useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
import {
  aggregateDailyIncomes,
  formatCurrency,
  getCurrentMonthEntries,
  getMonthlyTotals,
  getPlatformDistribution,
} from '@/lib/income';
import { useIncomeLogs } from '@/lib/queries/income';
import { getSessionUser } from '@/lib/session';
import { DashboardStats } from './_components/DashboardStats';
import { LineChart } from './_components/LineChart';
import { PieChart } from './_components/PieChart';
import { RecentDaysPanel } from './_components/RecentDaysPanel';
import { TotalsTable } from './_components/TotalsTable';

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
  const trackedDaysCount = dailySummaries.length;
  const averagePerDay = trackedDaysCount ? totalIncome / trackedDaysCount : 0;
  const currentMonthLabel = monthlyTotals[0]?.label ?? 'Current month';
  const currentMonthEntriesCount = currentMonthEntries.length;
  const stats = useMemo(() => {
    const trackedDaysLabel = `Across ${trackedDaysCount} ${
      trackedDaysCount === 1 ? 'day' : 'days'
    } tracked`;

    return [
      {
        title: 'Total income',
        value: formatCurrency(totalIncome),
        desc: trackedDaysLabel,
        valueClass: 'text-primary',
      },
      {
        title: 'Average / day',
        value: formatCurrency(averagePerDay),
        desc: 'Consistent hustle',
        valueClass: 'text-secondary',
      },
      {
        title: 'Platforms this month',
        value: String(platformDistribution.length),
        desc: currentMonthLabel,
      },
      {
        title: 'Current month',
        value: formatCurrency(currentMonthTotal),
        desc: `${currentMonthEntriesCount} entries logged`,
        valueClass: 'text-accent',
      },
    ];
  }, [
    totalIncome,
    averagePerDay,
    platformDistribution.length,
    currentMonthLabel,
    currentMonthTotal,
    currentMonthEntriesCount,
    trackedDaysCount,
  ]);

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
        <h1 className='text-3xl font-semibold text-base-content flex flex-col gap-1 md:flex-row md:items-center'>
          <span>Welcome back,</span>
          <span>{sessionUser?.name ?? sessionUser?.email ?? 'gig worker'}</span>
        </h1>
        <p className='text-sm text-base-content/60'>
          Track income, spot trends, and level up your earnings.
        </p>
      </header>

      <DashboardStats stats={stats} />

      <div className='grid gap-6 lg:grid-cols-[1.4fr_1fr]'>
        <RecentDaysPanel dailySummaries={dailySummaries} />
        <PieChart incomes={incomes} />
      </div>

      <LineChart incomes={incomes} />

      <TotalsTable incomes={incomes} />
    </div>
  );
}
