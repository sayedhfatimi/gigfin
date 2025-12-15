'use client';

import type { ReactNode } from 'react';

type FilterRowProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export default function FilterRow({
  label,
  children,
  className = '',
}: FilterRowProps) {
  const baseClass =
    'flex flex-col gap-2 bg-base-300 px-2 py-1 md:flex-row md:items-center md:justify-between';
  return (
    <div className={`${baseClass} ${className}`.trim()}>
      <span className='text-xs'>{label}</span>
      {children}
    </div>
  );
}
