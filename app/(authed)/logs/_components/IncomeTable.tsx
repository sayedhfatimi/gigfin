'use client';

import type { Row, Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';

import type { CurrencyCode } from '@/lib/currency';
import type {
  DailyIncomeSummary,
  IncomeEntry,
  MonthOption,
} from '@/lib/income';
import { GRID_TEMPLATE_CLASS } from '../_lib/layout';

import FilterPanel from './FilterPanel';
import FilterRow from './FilterRow';
import FilterSelect from './FilterSelect';
import IncomeSummaryRow from './IncomeSummaryRow';
import LoadingState from './LoadingState';
import PaginationControls from './PaginationControls';

export type IncomeTableProps = {
  isLoading: boolean;
  incomeTable: Table<DailyIncomeSummary>;
  pageRows: Row<DailyIncomeSummary>[];
  currency: CurrencyCode;
  platformOptions: string[];
  platformFilter: string[];
  monthOptions: MonthOption[];
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  togglePlatformSelection: (platform: string) => void;
  onPlatformFilterReset: () => void;
  onResetFilters: () => void;
  isFilterDirty: boolean;
  hasEntriesForSelectedMonth: boolean;
  emptyMonthMessage: string;
  hasAnyIncome: boolean;
  onEditEntry: (entry: IncomeEntry) => void;
  onDeleteEntry: (entry: IncomeEntry) => void;
  deleteDisabled: boolean;
  onCreateEntry: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function IncomeTable({
  isLoading,
  incomeTable,
  pageRows,
  currency,
  platformOptions,
  platformFilter,
  monthOptions,
  selectedMonth,
  onMonthChange,
  togglePlatformSelection,
  onPlatformFilterReset,
  onResetFilters,
  isFilterDirty,
  hasEntriesForSelectedMonth,
  emptyMonthMessage,
  hasAnyIncome,
  onEditEntry,
  onDeleteEntry,
  deleteDisabled,
  onCreateEntry,
  currentPage,
  totalPages,
  onPageChange,
}: IncomeTableProps) {
  const hasPlatforms = platformOptions.length > 0;

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
      <FilterPanel
        title='Filtering Options'
        onReset={onResetFilters}
        isResetDisabled={!isFilterDirty}
      >
        <FilterSelect
          label='Month'
          id='monthly-filter'
          value={selectedMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          disabled={isLoading}
          ariaBusy={isLoading}
          rowClassName='gap-1'
          options={monthOptions.map((option) => ({
            value: option.key,
            label: option.label,
          }))}
        />
        {hasPlatforms ? (
          <FilterRow label='Platforms' className='gap-2'>
            <div className='flex flex-wrap gap-2 px-1 md:flex-nowrap md:overflow-x-auto'>
              {platformOptions.map((platform) => {
                const isChecked = platformFilter.includes(platform);
                return (
                  <label
                    key={platform}
                    className={`btn btn-xs normal-case ${
                      isChecked
                        ? 'btn-primary btn-active text-white'
                        : 'btn-outline'
                    }`}
                  >
                    <input
                      type='checkbox'
                      name='platforms'
                      value={platform}
                      aria-label={platform}
                      checked={isChecked}
                      onChange={() => togglePlatformSelection(platform)}
                      className='sr-only'
                    />
                    {platform}
                  </label>
                );
              })}
              <button
                type='button'
                className='btn btn-xs btn-square btn-error text-xs hidden md:inline-flex'
                onClick={onPlatformFilterReset}
                disabled={!platformFilter.length}
                aria-label='Clear platform filters'
              >
                <i className='fa-solid fa-xmark' aria-hidden='true' />
              </button>
            </div>
          </FilterRow>
        ) : (
          <span className='text-xs uppercase text-base-content/60'>
            No platforms yet
          </span>
        )}
      </FilterPanel>
      {isLoading ? (
        <LoadingState message='Loading logs…' />
      ) : !hasEntriesForSelectedMonth ? (
        <div className='flex min-h-60 flex-col items-center justify-center gap-3 text-sm text-base-content/60'>
          <p>{emptyMonthMessage}</p>
          <p className='text-xs text-base-content/60'>
            {hasAnyIncome
              ? 'Switch months or add an income entry to fill the timeframe.'
              : 'Hit the button above to log your first income.'}
          </p>
          <button
            type='button'
            className='btn btn-sm btn-outline'
            onClick={onCreateEntry}
          >
            Create entry
          </button>
        </div>
      ) : (
        <div className='space-y-3'>
          {incomeTable.getHeaderGroups().length ? (
            <div
              className={`hidden ${GRID_TEMPLATE_CLASS} bg-base-100/50 py-3 gap-4 text-xs uppercase text-base-content/60 px-4`}
            >
              {incomeTable.getHeaderGroups()[0].headers.map((header) => (
                <div key={header.id} className='text-left'>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </div>
              ))}
              <span
                aria-hidden='true'
                className='fa-solid fa-up-down text-xs text-base-content/60'
              />
            </div>
          ) : null}
          <div className='space-y-3'>
            {pageRows.map((row) => (
              <IncomeSummaryRow
                key={row.id}
                row={row}
                currency={currency}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
                deleteDisabled={deleteDisabled}
              />
            ))}
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </section>
  );
}
