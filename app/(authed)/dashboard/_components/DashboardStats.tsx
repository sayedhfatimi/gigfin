'use client';

import { StatCard } from './StatCard';

export type DashboardStat = {
  title: string;
  value: string;
  desc: string;
  valueClass?: string;
};

type DashboardStatsProps = {
  stats: DashboardStat[];
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className='stats w-full stats-vertical md:stats-horizontal rounded-none shadow-sm'>
      {stats.map((stat) => (
        <StatCard key={stat.title} stat={stat} />
      ))}
    </div>
  );
}
