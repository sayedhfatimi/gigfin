'use client';

import type { ReactNode } from 'react';

import type { CurrencyCode } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import { expenseTypeOptions } from '@/lib/expenses';
import type { MonthOption } from '@/lib/income';

import { GRID_TEMPLATE_CLASS } from '../_lib/layout';
import type { ExpenseSortColumn, ExpenseSortState } from '../_lib/types';

import ExpenseLogRow from './ExpenseLogRow';
import FilterPanel from './FilterPanel';
import FilterRow from './FilterRow';
import FilterSelect from './FilterSelect';
import LoadingState from './LoadingState';
import PaginationControls from './PaginationControls';

export type ExpenseTableProps = {
  isLoading: boolean;
  expensePageEntries: ExpenseEntry[];
  currency: CurrencyCode;
  expenseSort: ExpenseSortState;
  toggleExpenseSort: (column: ExpenseSortColumn) => void;
  getExpenseSortIcon: (column: ExpenseSortColumn) => string;
  selectedExpenseMonth: string;
  expenseMonthOptions: MonthOption[];
  selectedExpenseType: string;
  onMonthChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  isExpenseFilterDirty: boolean;
  onResetFilters: () => void;
  vehicleFilterControl: ReactNode | null;
  expenseEmptyMessage: string;
  expandedExpenseRows: Set<string>;
  onToggleExpenseRow: (id: string) => void;
  onEditExpense: (entry: ExpenseEntry) => void;
  onDeleteExpense: (entry: ExpenseEntry) => void;
  deleteDisabled: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function ExpenseTable({
  isLoading,
  expensePageEntries,
  currency,
  expenseSort,
  toggleExpenseSort,
  getExpenseSortIcon,
  selectedExpenseMonth,
  expenseMonthOptions,
  selectedExpenseType,
  onMonthChange,
  onTypeChange,
  isExpenseFilterDirty,
  onResetFilters,
  vehicleFilterControl,
  expenseEmptyMessage,
  expandedExpenseRows,
  onToggleExpenseRow,
  onEditExpense,
  onDeleteExpense,
  deleteDisabled,
  currentPage,
  totalPages,
  onPageChange,
}: ExpenseTableProps) {
  const renderExpenseSortButton = (
    column: ExpenseSortColumn,
    label: string,
    alignRight = false,
  ) => {
    const isActive = expenseSort?.column === column;
    const alignmentClasses =
      alignRight === true
        ? 'justify-end text-right'
        : 'justify-start text-left';
    return (
      <button
        type='button'
        className={`flex w-full items-center gap-2 text-xs font-semibold uppercase ${alignmentClasses}`}
        onClick={() => toggleExpenseSort(column)}
        aria-pressed={isActive}
      >
        <span className={`text-base-content ${isActive ? 'text-primary' : ''}`}>
          {label}
        </span>
        <span
          aria-hidden='true'
          className={`fa-solid ${getExpenseSortIcon(column)} text-[0.6rem] ${
            isActive ? 'text-primary' : 'text-base-content/60'
          }`}
        />
      </button>
    );
  };

  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
      <FilterPanel
        title='Filtering Options'
        onReset={onResetFilters}
        isResetDisabled={!isExpenseFilterDirty}
      >
        <FilterSelect
          label='Month'
          id='expenses-month-filter'
          value={selectedExpenseMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          disabled={isLoading}
          ariaBusy={isLoading}
          options={expenseMonthOptions.map((option) => ({
            value: option.key,
            label: option.label,
          }))}
        />
        <FilterSelect
          label='Type'
          value={selectedExpenseType}
          onChange={(event) => onTypeChange(event.target.value)}
          disabled={isLoading}
          ariaBusy={isLoading}
          options={[
            { value: 'all', label: 'All types' },
            ...expenseTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
        />
        <FilterRow label='Vehicles'>
          <div className='flex flex-wrap justify-end gap-2'>
            {vehicleFilterControl ?? (
              <span className='text-xs uppercase text-base-content/60'>
                Add a vehicle profile to filter expenses.
              </span>
            )}
          </div>
        </FilterRow>
      </FilterPanel>
      {isLoading ? (
        <LoadingState message='Loading expenses…' />
      ) : expensePageEntries.length === 0 ? (
        <div className='flex min-h-40 flex-col items-center justify-center text-sm text-base-content/60'>
          <p>{expenseEmptyMessage}</p>
        </div>
      ) : (
        <div className='space-y-3'>
          <div
            className={`hidden ${GRID_TEMPLATE_CLASS} bg-base-100/50 py-3 gap-4 text-xs uppercase text-base-content/60 px-4`}
          >
            <div className='text-left'>
              {renderExpenseSortButton('date', 'Date')}
            </div>
            <div className='text-left'>
              {renderExpenseSortButton('type', 'Type')}
            </div>
            <div className='text-right'>
              {renderExpenseSortButton('amount', 'Amount', true)}
            </div>
            <span
              aria-hidden='true'
              className='fa-solid fa-up-down text-xs text-base-content/60'
            />
          </div>
          <div className='space-y-2'>
            {expensePageEntries.map((entry) => (
              <ExpenseLogRow
                key={entry.id}
                entry={entry}
                currency={currency}
                isExpanded={expandedExpenseRows.has(entry.id)}
                onToggle={() => onToggleExpenseRow(entry.id)}
                onEdit={onEditExpense}
                onDelete={onDeleteExpense}
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
