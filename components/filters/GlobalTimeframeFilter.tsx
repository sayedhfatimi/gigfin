'use client';

import { useGlobalTimeframe } from '@/lib/contexts/GlobalTimeframeContext';

type GlobalTimeframeFilterProps = {
  className?: string;
};

export function GlobalTimeframeFilter({
  className = '',
}: GlobalTimeframeFilterProps) {
  const { timeframe, setTimeframe, selectedOption, options } =
    useGlobalTimeframe();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className='hidden sm:flex items-center gap-2 text-xs text-base-content/60'>
        <span className='fa-solid fa-calendar-days' aria-hidden='true' />
        <span>Viewing:</span>
      </div>
      <label className='select select-sm select-bordered'>
        <span className='sr-only'>Global timeframe filter</span>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
          aria-label='Select timeframe'
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <span className='hidden md:block text-xs text-base-content/50'>
        {selectedOption.description}
      </span>
    </div>
  );
}

/**
 * Compact version for mobile/smaller spaces
 */
export function GlobalTimeframeFilterCompact() {
  const { timeframe, setTimeframe, options } = useGlobalTimeframe();

  return (
    <div className='dropdown dropdown-end'>
      <button
        type='button'
        className='btn btn-sm btn-ghost gap-2'
        aria-label='Change timeframe'
      >
        <span className='fa-solid fa-calendar-days' aria-hidden='true' />
        <span className='hidden sm:inline'>
          {options.find((o) => o.value === timeframe)?.label ?? 'This month'}
        </span>
        <span className='fa-solid fa-chevron-down text-xs' aria-hidden='true' />
      </button>
      <ul className='dropdown-content menu rounded-box z-20 mt-2 w-52 border border-base-content/10 bg-base-100 p-2 shadow-lg'>
        {options.map((option) => (
          <li key={option.value}>
            <button
              type='button'
              className={`flex flex-col items-start ${
                timeframe === option.value ? 'active' : ''
              }`}
              onClick={() => setTimeframe(option.value)}
            >
              <span className='font-medium'>{option.label}</span>
              <span className='text-xs text-base-content/60'>
                {option.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
