'use client';

import type { CurrencyCode } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';

import { GRID_TEMPLATE_CLASS } from '../_lib/layout';
import type { ExpenseSortColumn, ExpenseSortState } from '../_lib/types';

import ExpenseLogRow from './ExpenseLogRow';
import LoadingState from './LoadingState';
import PaginationControls from './PaginationControls';

export type ExpenseTableProps = {
  isLoading: boolean;
  expensePageEntries: ExpenseEntry[];
  currency: CurrencyCode;
  expenseSort: ExpenseSortState;
  toggleExpenseSort: (column: ExpenseSortColumn) => void;
  getExpenseSortIcon: (column: ExpenseSortColumn) => string;
  expenseEmptyMessage: string;
  expandedExpenseRows: Set<string>;
  onToggleExpenseRow: (id: string) => void;
  onEditExpense: (entry: ExpenseEntry) => void;
  onDeleteExpense: (entry: ExpenseEntry) => void;
  deleteDisabled: boolean;
  onCreateEntry: () => void;
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
  expenseEmptyMessage,
  expandedExpenseRows,
  onToggleExpenseRow,
  onEditExpense,
  onDeleteExpense,
  deleteDisabled,
  onCreateEntry,
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
    <section className='rounded-lg border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
      {isLoading ? (
        <LoadingState message='Loading expenses…' />
      ) : expensePageEntries.length === 0 ? (
        <div className='flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-base-content/60'>
          <span
            className='fa-solid fa-receipt text-4xl text-base-content/20'
            aria-hidden='true'
          />
          <p>{expenseEmptyMessage}</p>
          <button
            type='button'
            className='btn btn-sm btn-outline'
            onClick={onCreateEntry}
          >
            <span className='fa-solid fa-plus mr-2' aria-hidden='true' />
            Add expense
          </button>
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
