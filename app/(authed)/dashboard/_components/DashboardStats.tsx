'use client';

import { formatCurrency } from '@/lib/income';

type DashboardStatsProps = {
  totalIncome: number;
  averagePerDay: number;
  platformCount: number;
  currentMonthLabel: string;
  currentMonthTotal: number;
  currentMonthEntriesCount: number;
  trackedDaysCount: number;
};

export function DashboardStats({
  totalIncome,
  averagePerDay,
  platformCount,
  currentMonthLabel,
  currentMonthTotal,
  currentMonthEntriesCount,
  trackedDaysCount,
}: DashboardStatsProps) {
  const stats = [
    {
      title: 'Total income',
      value: formatCurrency(totalIncome),
      desc: `Across ${trackedDaysCount} ${
        trackedDaysCount === 1 ? 'day' : 'days'
      } tracked`,
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
      value: String(platformCount),
      desc: currentMonthLabel,
      valueClass: '',
    },
    {
      title: 'Current month',
      value: formatCurrency(currentMonthTotal),
      desc: `${currentMonthEntriesCount} entries logged`,
      valueClass: 'text-accent',
    },
  ];

  return (
    <div className='stats w-full stats-vertical md:stats-horizontal'>
      {stats.map((stat) => (
        <div
          key={stat.title}
          className='stat flex-1 min-w-0 border border-base-content/10 bg-base-100 shadow-sm'
        >
          <div className='stat-title text-xs uppercase tracking-[0.4em] text-base-content/50'>
            {stat.title}
          </div>
          <div
            className={`stat-value text-3xl font-semibold ${stat.valueClass}`.trim()}
          >
            {stat.value}
          </div>
          <div className='stat-desc text-sm text-base-content/60'>
            {stat.desc}
          </div>
        </div>
      ))}
    </div>
  );
}
