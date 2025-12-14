'use client';

import type { CurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';

type PlatformDistributionRow = {
  platform: string;
  amount: number;
  percentage: number;
};

type PlatformConcentrationPanelProps = {
  platformDistribution: PlatformDistributionRow[];
  currency: CurrencyCode;
};

const percentFormatter = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function PlatformConcentrationPanel({
  platformDistribution,
  currency,
}: PlatformConcentrationPanelProps) {
  const topPlatforms = platformDistribution.slice(0, 3);
  const topShare = topPlatforms.reduce((acc, row) => acc + row.percentage, 0);
  const totalPlatforms = platformDistribution.length;
  const headlineLabel = topPlatforms.length
    ? `Top ${topPlatforms.length} platforms`
    : 'Top platforms';

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-base-content'>
            Platform concentration
          </h2>
          <p className='text-xs uppercase text-base-content/60'>
            Income mix · this month
          </p>
        </div>
        <p className='text-xs text-base-content/60'>
          {headlineLabel} · {percentFormatter.format(topShare)}
        </p>
      </div>
      {topPlatforms.length ? (
        <div className='mt-6 space-y-3 text-sm'>
          {topPlatforms.map((row) => (
            <div
              key={row.platform}
              className='flex items-center justify-between gap-3 rounded-lg border border-base-content/10 bg-base-200/50 p-3'
            >
              <div>
                <p className='font-semibold text-base-content'>
                  {row.platform}
                </p>
                <p className='text-xs text-base-content/50'>
                  {formatCurrency(row.amount, currency)}
                </p>
              </div>
              <span className='text-sm font-semibold text-base-content'>
                {percentFormatter.format(row.percentage)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className='mt-6 text-xs text-base-content/50'>
          No platform breakdown yet. Log income to highlight where your earnings
          are concentrated.
        </p>
      )}
      {totalPlatforms > topPlatforms.length && (
        <p className='mt-4 text-xs text-base-content/60'>
          Spread across {totalPlatforms} platforms gives you flexibility while
          the top share is {percentFormatter.format(topShare)}.
        </p>
      )}
    </section>
  );
}
