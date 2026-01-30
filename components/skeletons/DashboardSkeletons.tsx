'use client';

/**
 * Skeleton components for dashboard loading states
 */

type SkeletonProps = {
  className?: string;
};

export function SkeletonText({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton h-4 rounded ${className}`} aria-hidden='true' />
  );
}

export function SkeletonHeading({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton h-8 rounded ${className}`} aria-hidden='true' />
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton h-32 rounded-lg ${className}`}
      aria-hidden='true'
    />
  );
}

export function SkeletonChart({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton h-52 rounded-lg ${className}`}
      aria-hidden='true'
    />
  );
}

/**
 * Skeleton for stat cards row
 */
export function DashboardStatsSkeleton() {
  return (
    <div className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='space-y-2'>
            <div className='skeleton h-4 w-24 rounded' />
            <div className='skeleton h-8 w-32 rounded' />
            <div className='skeleton h-3 w-20 rounded' />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hero snapshot skeleton
 */
export function TodaySnapshotSkeleton() {
  return (
    <div className='border-2 border-primary/20 bg-linear-to-br from-primary/5 to-secondary/5 p-6 shadow-lg md:col-span-2'>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-2'>
          <div className='skeleton h-6 w-40 rounded' />
          <div className='skeleton h-4 w-24 rounded' />
        </div>
        <div className='skeleton h-8 w-24 rounded-full' />
      </div>
      <div className='mt-6 grid gap-6 sm:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='rounded-xl border border-base-content/10 bg-base-100/80 p-4 backdrop-blur'
          >
            <div className='skeleton h-4 w-20 rounded mb-2' />
            <div className='skeleton h-10 w-28 rounded mb-1' />
            <div className='skeleton h-3 w-16 rounded' />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Profitability panel skeleton
 */
export function ProfitabilityPanelSkeleton() {
  return (
    <div className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-2'>
          <div className='skeleton h-6 w-28 rounded' />
          <div className='skeleton h-4 w-36 rounded' />
        </div>
        <div className='skeleton h-6 w-20 rounded' />
      </div>
      <div className='mt-6 grid gap-4 sm:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='rounded border border-base-content/10 bg-base-100 p-4 shadow-sm'
          >
            <div className='skeleton h-3 w-16 rounded mb-2' />
            <div className='skeleton h-8 w-24 rounded mb-1' />
            <div className='skeleton h-3 w-12 rounded' />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chart widget skeleton
 */
export function ChartWidgetSkeleton({
  title = 'Loading chart...',
}: {
  title?: string;
}) {
  return (
    <div className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4 mb-6'>
        <div className='space-y-2'>
          <div className='skeleton h-6 w-32 rounded' />
          <div className='skeleton h-4 w-24 rounded' />
        </div>
        <div className='skeleton h-8 w-24 rounded' />
      </div>
      <div className='skeleton h-52 w-full rounded-lg' />
      <span className='sr-only'>{title}</span>
    </div>
  );
}

/**
 * Generic panel skeleton
 */
export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4 mb-6'>
        <div className='space-y-2'>
          <div className='skeleton h-6 w-28 rounded' />
          <div className='skeleton h-4 w-20 rounded' />
        </div>
        <div className='skeleton h-6 w-16 rounded' />
      </div>
      <div className='space-y-3'>
        {Array.from({ length: rows }, (_, i) => `row-${i + 1}`).map((rowId) => (
          <div key={rowId} className='flex items-center justify-between'>
            <div className='skeleton h-4 w-24 rounded' />
            <div className='skeleton h-4 w-16 rounded' />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Goal tracker skeleton
 */
export function GoalTrackerSkeleton() {
  return (
    <div className='border border-base-content/10 bg-base-100 p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-2'>
          <div className='skeleton h-6 w-28 rounded' />
          <div className='skeleton h-4 w-32 rounded' />
        </div>
        <div className='skeleton h-8 w-20 rounded' />
      </div>
      <div className='mt-6 space-y-4'>
        <div className='skeleton h-4 w-full rounded-full' />
        <div className='grid gap-4 sm:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='space-y-2'>
              <div className='skeleton h-3 w-16 rounded' />
              <div className='skeleton h-6 w-20 rounded' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Full dashboard skeleton for initial load
 */
export function DashboardSkeleton() {
  return (
    <output className='block space-y-6' aria-label='Loading dashboard...'>
      <div className='space-y-1'>
        <div className='skeleton h-3 w-16 rounded' />
        <div className='skeleton h-10 w-48 rounded' />
        <div className='skeleton h-4 w-64 rounded' />
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <TodaySnapshotSkeleton />
        <DashboardStatsSkeleton />
        <ProfitabilityPanelSkeleton />
        <PanelSkeleton rows={3} />
        <ChartWidgetSkeleton />
        <ChartWidgetSkeleton />
      </div>

      <span className='sr-only'>Loading your dashboard data...</span>
    </output>
  );
}
