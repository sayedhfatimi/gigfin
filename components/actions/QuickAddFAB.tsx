'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type QuickAddType = 'income' | 'expense' | 'odometer';

type QuickAddFABProps = {
  className?: string;
};

export function QuickAddFAB({ className = '' }: QuickAddFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSelect = (type: QuickAddType) => {
    setIsOpen(false);
    // Navigate to logs page with the appropriate tab and modal open
    router.push(
      `/logs?view=${
        type === 'income'
          ? 'income'
          : type === 'expense'
            ? 'expenses'
            : 'odometer'
      }&add=true`,
    );
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`fixed bottom-24 right-4 z-40 lg:bottom-6 ${className}`}>
      {/* Backdrop */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-base-content/20 backdrop-blur-sm'
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          aria-hidden='true'
        />
      )}

      {/* Speed dial menu */}
      <div className='relative'>
        {isOpen && (
          <div className='absolute bottom-16 right-0 flex flex-col gap-3 pb-2'>
            {/* Income */}
            <button
              type='button'
              onClick={() => handleSelect('income')}
              className='btn btn-circle btn-success shadow-lg tooltip tooltip-left'
              data-tip='Add income'
              aria-label='Add income entry'
            >
              <span className='fa-solid fa-plus text-lg' aria-hidden='true' />
              <span className='sr-only'>Add income</span>
            </button>

            {/* Expense */}
            <button
              type='button'
              onClick={() => handleSelect('expense')}
              className='btn btn-circle btn-error shadow-lg tooltip tooltip-left'
              data-tip='Add expense'
              aria-label='Add expense entry'
            >
              <span className='fa-solid fa-minus text-lg' aria-hidden='true' />
              <span className='sr-only'>Add expense</span>
            </button>

            {/* Odometer */}
            <button
              type='button'
              onClick={() => handleSelect('odometer')}
              className='btn btn-circle btn-info shadow-lg tooltip tooltip-left'
              data-tip='Log odometer'
              aria-label='Log odometer reading'
            >
              <span className='fa-solid fa-gauge text-lg' aria-hidden='true' />
              <span className='sr-only'>Log odometer</span>
            </button>
          </div>
        )}

        {/* Main FAB */}
        <button
          type='button'
          onClick={toggleMenu}
          className={`btn btn-circle btn-primary btn-lg shadow-xl transition-transform duration-200 ${
            isOpen ? 'rotate-45' : ''
          }`}
          aria-label={isOpen ? 'Close quick add menu' : 'Open quick add menu'}
          aria-expanded={isOpen}
        >
          <span className='fa-solid fa-plus text-2xl' aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}

/**
 * Inline quick add buttons for desktop dashboard header
 */
export function QuickAddButtons({ className = '' }: { className?: string }) {
  const router = useRouter();

  const handleAdd = (type: QuickAddType) => {
    router.push(
      `/logs?view=${
        type === 'income'
          ? 'income'
          : type === 'expense'
            ? 'expenses'
            : 'odometer'
      }&add=true`,
    );
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type='button'
        onClick={() => handleAdd('income')}
        className='btn btn-sm btn-success gap-2'
        aria-label='Add income entry'
      >
        <span className='fa-solid fa-plus' aria-hidden='true' />
        <span className='hidden sm:inline'>Income</span>
      </button>
      <button
        type='button'
        onClick={() => handleAdd('expense')}
        className='btn btn-sm btn-error gap-2'
        aria-label='Add expense entry'
      >
        <span className='fa-solid fa-minus' aria-hidden='true' />
        <span className='hidden sm:inline'>Expense</span>
      </button>
      <button
        type='button'
        onClick={() => handleAdd('odometer')}
        className='btn btn-sm btn-info gap-2'
        aria-label='Log odometer'
      >
        <span className='fa-solid fa-gauge' aria-hidden='true' />
        <span className='hidden sm:inline'>Odometer</span>
      </button>
    </div>
  );
}
