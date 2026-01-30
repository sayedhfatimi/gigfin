'use client';

import type { ReactNode } from 'react';

import type { CurrencyCode } from '@/lib/currency';
import type { MonthOption } from '@/lib/income';
import type { CombinedTransaction } from '../_lib/types';
import type { DateRange } from './DateRangeFilter';
import DateRangeFilter from './DateRangeFilter';
import ExportButton from './ExportButton';
import SearchBar from './SearchBar';

type View = 'all' | 'income' | 'expenses' | 'odometer';

type FilterToolbarProps = {
  view: View;
  currency: CurrencyCode;
  // Search & Date Range (all views)
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  // Income-specific
  monthOptions?: MonthOption[];
  selectedMonth?: string;
  onMonthChange?: (value: string) => void;
  platformOptions?: string[];
  platformFilter?: string[];
  onPlatformToggle?: (platform: string) => void;
  onPlatformReset?: () => void;
  // Expense-specific
  expenseMonthOptions?: MonthOption[];
  selectedExpenseMonth?: string;
  onExpenseMonthChange?: (value: string) => void;
  selectedExpenseType?: string;
  onExpenseTypeChange?: (value: string) => void;
  expenseTypeOptions?: { value: string; label: string }[];
  // Vehicle filter (expenses, odometer, all)
  vehicleFilterControl?: ReactNode | null;
  // Export
  transactions?: CombinedTransaction[];
  // Reset
  isFilterDirty?: boolean;
  onResetFilters?: () => void;
  // Loading state
  isLoading?: boolean;
};

export default function FilterToolbar({
  view,
  currency,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  monthOptions = [],
  selectedMonth = '',
  onMonthChange,
  platformOptions = [],
  platformFilter = [],
  onPlatformToggle,
  onPlatformReset,
  expenseMonthOptions = [],
  selectedExpenseMonth = '',
  onExpenseMonthChange,
  selectedExpenseType = 'all',
  onExpenseTypeChange,
  expenseTypeOptions = [],
  vehicleFilterControl,
  transactions = [],
  isFilterDirty = false,
  onResetFilters,
  isLoading = false,
}: FilterToolbarProps) {
  const hasPlatforms = platformOptions.length > 0;

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-base-content/10 bg-base-100 p-4 shadow-sm'>
      {/* Row 1: Search + Date Range + Export */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={
            view === 'income'
              ? 'Search by platform, amount...'
              : view === 'expenses'
                ? 'Search by type, amount, notes...'
                : view === 'odometer'
                  ? 'Search by vehicle...'
                  : 'Search entries...'
          }
          className='w-full sm:max-w-xs'
        />
        <div className='flex flex-wrap items-center gap-2'>
          <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
          {view === 'all' && transactions.length > 0 && (
            <ExportButton transactions={transactions} currency={currency} />
          )}
        </div>
      </div>

      {/* Row 2: View-specific filters */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap'>
        {/* Income view: Month + Platform pills */}
        {view === 'income' && (
          <>
            <div className='flex items-center gap-2'>
              <span className='text-xs uppercase text-base-content/60'>
                Month
              </span>
              <select
                className='select select-bordered select-sm'
                value={selectedMonth}
                onChange={(e) => onMonthChange?.(e.target.value)}
                disabled={isLoading}
              >
                {monthOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {hasPlatforms && (
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-xs uppercase text-base-content/60'>
                  Platforms
                </span>
                <div className='flex flex-wrap gap-1'>
                  {platformOptions.map((platform) => {
                    const isChecked = platformFilter.includes(platform);
                    return (
                      <button
                        key={platform}
                        type='button'
                        onClick={() => onPlatformToggle?.(platform)}
                        className={`btn btn-xs normal-case ${
                          isChecked ? 'btn-primary' : 'btn-outline'
                        }`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                  {platformFilter.length > 0 && (
                    <button
                      type='button'
                      className='btn btn-xs btn-square btn-ghost'
                      onClick={onPlatformReset}
                      aria-label='Clear platform filters'
                    >
                      <i className='fa-solid fa-xmark' aria-hidden='true' />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Expense view: Month + Type */}
        {view === 'expenses' && (
          <>
            <div className='flex items-center gap-2'>
              <span className='text-xs uppercase text-base-content/60'>
                Month
              </span>
              <select
                className='select select-bordered select-sm'
                value={selectedExpenseMonth}
                onChange={(e) => onExpenseMonthChange?.(e.target.value)}
                disabled={isLoading}
              >
                {expenseMonthOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs uppercase text-base-content/60'>
                Type
              </span>
              <select
                className='select select-bordered select-sm'
                value={selectedExpenseType}
                onChange={(e) => onExpenseTypeChange?.(e.target.value)}
                disabled={isLoading}
              >
                <option value='all'>All types</option>
                {expenseTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Vehicle filter (all views except income) */}
        {(view === 'all' || view === 'expenses' || view === 'odometer') &&
          vehicleFilterControl && (
            <div className='flex items-center gap-2'>
              <span className='text-xs uppercase text-base-content/60'>
                Vehicle
              </span>
              {vehicleFilterControl}
            </div>
          )}

        {/* Reset button */}
        {isFilterDirty && onResetFilters && (
          <button
            type='button'
            className='btn btn-ghost btn-sm gap-1 ml-auto'
            onClick={onResetFilters}
          >
            <i className='fa-solid fa-rotate-left' aria-hidden='true' />
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
