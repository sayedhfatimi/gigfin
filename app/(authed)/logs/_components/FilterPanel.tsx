'use client';

import type { ReactNode } from 'react';

type FilterPanelProps = {
  title: string;
  children: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  isResetDisabled?: boolean;
};

export default function FilterPanel({
  title,
  children,
  onReset,
  resetLabel = 'Reset',
  isResetDisabled = false,
}: FilterPanelProps) {
  return (
    <div className='flex flex-col gap-2 bg-base-200 p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xs uppercase text-base-content/60'>{title}</h1>
        {onReset ? (
          <button
            type='button'
            className='btn btn-sm btn-warning'
            onClick={onReset}
            disabled={isResetDisabled}
          >
            <span className='fa-solid fa-rotate-left' aria-hidden='true' />
            {resetLabel}
          </button>
        ) : null}
      </div>
      <div className='flex flex-col gap-3'>{children}</div>
    </div>
  );
}
