'use client';

import { useMemo } from 'react';

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSession } from '@/lib/auth-client';
import {
  aggregateDailyIncomes,
  formatCurrency,
  formatMonthShortLabel,
  getCurrentMonthEntries,
  getMonthlyTotals,
  getPlatformDistribution,
  getYearlyMonthlyTotals,
} from '@/lib/income';
import { useIncomeLogs } from '@/lib/queries/income';
import { getSessionUser } from '@/lib/session';

const palette = [
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#F43F5E',
  '#0EA5E9',
  '#EAB308',
];

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
  const pieChartData = useMemo(
    () =>
      platformDistribution.map((item) => ({
        name: item.platform,
        value: item.amount,
      })),
    [platformDistribution],
  );
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
        <p className='text-sm uppercase tracking-[0.4em] text-base-content/60'>
          Dashboard
        </p>
        <h1 className='text-3xl font-semibold text-base-content'>
          Welcome back,{' '}
          {sessionUser?.name ?? sessionUser?.email ?? 'gig worker'}
        </h1>
        <p className='text-sm text-base-content/60'>
          Track income, spot trends, and level up your earnings.
        </p>
      </header>

      <div className='stats w-full stats-vertical md:stats-horizontal'>
        <div className='stat flex-1 min-w-0 border border-base-content/10 bg-base-100 shadow-sm'>
          <div className='stat-title text-xs uppercase tracking-[0.4em] text-base-content/50'>
            Total income
          </div>
          <div className='stat-value text-3xl font-semibold text-primary'>
            {formatCurrency(totalIncome)}
          </div>
          <div className='stat-desc text-sm text-base-content/60'>
            Across {dailySummaries.length}{' '}
            {dailySummaries.length === 1 ? 'day' : 'days'} tracked
          </div>
        </div>
        <div className='stat flex-1 min-w-0 border border-base-content/10 bg-base-100 shadow-sm'>
          <div className='stat-title text-xs uppercase tracking-[0.4em] text-base-content/50'>
            Average / day
          </div>
          <div className='stat-value text-3xl font-semibold text-secondary'>
            {formatCurrency(averagePerDay)}
          </div>
          <div className='stat-desc text-sm text-base-content/60'>
            Consistent hustle
          </div>
        </div>
        <div className='stat flex-1 min-w-0 border border-base-content/10 bg-base-100 shadow-sm'>
          <div className='stat-title text-xs uppercase tracking-[0.4em] text-base-content/50'>
            Platforms this month
          </div>
          <div className='stat-value text-3xl font-semibold'>
            {platformDistribution.length || 0}
          </div>
          <div className='stat-desc text-sm text-base-content/60'>
            {currentMonthLabel}
          </div>
        </div>
        <div className='stat flex-1 min-w-0 border border-base-content/10 bg-base-100 shadow-sm'>
          <div className='stat-title text-xs uppercase tracking-[0.4em] text-base-content/50'>
            Current month
          </div>
          <div className='stat-value text-3xl font-semibold text-accent'>
            {formatCurrency(currentMonthTotal)}
          </div>
          <div className='stat-desc text-sm text-base-content/60'>
            {currentMonthEntries.length} entries logged
          </div>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1.4fr_1fr]'>
        <section className='space-y-4  border border-base-content/10 bg-base-100 p-6 shadow-sm'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-base-content'>
              Recent days
            </h2>
            <p className='text-xs uppercase tracking-[0.4em] text-base-content/50'>
              totals
            </p>
          </div>
          {dailySummaries.length ? (
            <div className='space-y-4'>
              {dailySummaries.slice(0, 3).map((day) => (
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

        <section className=' border border-base-content/10 bg-base-100 p-6 shadow-sm'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-base-content'>
              Platform breakdown
            </h2>
            <p className='text-xs uppercase tracking-[0.4em] text-base-content/50'>
              Pie
            </p>
          </div>
          <div className='mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center'>
            <div className='h-44 w-full'>
              {pieChartData.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      innerRadius={34}
                      outerRadius={64}
                      paddingAngle={2}
                    >
                      {pieChartData.map((segment, index) => (
                        <Cell
                          key={`${segment.name}-${index}`}
                          fill={palette[index % palette.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(label) => String(label)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex h-full items-center justify-center rounded-full border border-dashed border-base-content/20 text-xs text-base-content/50'>
                  No platform data yet
                </div>
              )}
            </div>
            <div className='space-y-3 text-sm'>
              {platformDistribution.map((item, index) => (
                <div
                  key={item.platform}
                  className='flex items-center justify-between gap-4'
                >
                  <span className='flex items-center gap-3'>
                    <span
                      className='h-3 w-3 rounded-full'
                      style={{
                        backgroundColor: palette[index % palette.length],
                      }}
                    />
                    <span className='text-base-content'>{item.platform}</span>
                  </span>
                  <span className='font-semibold text-base-content'>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {!platformDistribution.length && (
                <p className='text-xs text-base-content/50'>
                  Start adding logs on the Logs tab to build up your insights.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
      <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-base-content'>
              Yearly income trend
            </h2>
            <p className='text-xs uppercase tracking-[0.4em] text-base-content/60'>
              Month over month
            </p>
          </div>
          <p className='text-xs uppercase tracking-[0.4em] text-base-content/50'>
            {currentYear}
          </p>
        </div>
        <div className='mt-6'>
          <div className='h-60 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={yearlyChartData}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  strokeOpacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey='label'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(Number(value))}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Line
                  type='monotone'
                  dataKey='total'
                  stroke='#6366F1'
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className='mt-3 flex items-center justify-between text-xs font-semibold text-base-content/60'>
            <span>{formatCurrency(0)}</span>
            <span>{formatCurrency(yearlyChartMax)}</span>
          </div>
        </div>
      </section>
      <section className=' border border-base-content/10 bg-base-100 p-6 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-base-content'>
              Monthly totals
            </h2>
            <p className='text-xs uppercase tracking-[0.4em] text-base-content/60'>
              Last 6 months
            </p>
          </div>
        </div>
        <div className='mt-4 overflow-x-auto'>
          <table className='table w-full table-zebra'>
            <thead>
              <tr>
                <th className='text-left text-xs uppercase tracking-[0.4em] text-base-content/50'>
                  Month
                </th>
                <th className='text-left text-xs uppercase tracking-[0.4em] text-base-content/50'>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyTotals.map((summary, index) => (
                <tr
                  key={`${summary.year}-${summary.month}`}
                  className={
                    index === 0 ? 'font-semibold text-base-content' : ''
                  }
                >
                  <td>{summary.label}</td>
                  <td className='font-semibold text-base-content'>
                    {formatCurrency(summary.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
