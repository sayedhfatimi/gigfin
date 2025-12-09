'use client';

import { MonthlyIncomeSummary, formatCurrency } from '@/lib/income';

type MonthlyTotalsTableProps = {
  monthlyTotals: MonthlyIncomeSummary[];
};

export function MonthlyTotalsTable({ monthlyTotals }: MonthlyTotalsTableProps) {
  return (
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
                className={index === 0 ? 'font-semibold text-base-content' : ''}
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
  );
}
