'use client';
import type { DashboardStat } from './DashboardStats';

export function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <div className='stat flex-1 min-w-0 border border-base-content/10 bg-base-100 shadow-sm'>
      <div className='stat-title text-xs uppercase text-base-content/50'>
        {stat.title}
      </div>
      <div
        className={`stat-value text-3xl font-semibold ${stat.valueClass ?? ''}`.trim()}
      >
        {stat.value}
      </div>
      <div className='stat-desc text-sm text-base-content/60'>{stat.desc}</div>
    </div>
  );
}
