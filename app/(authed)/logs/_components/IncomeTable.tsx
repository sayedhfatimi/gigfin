'use client';

import type { Row, Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';

import type { CurrencyCode } from '@/lib/currency';
import type { DailyIncomeSummary, IncomeEntry } from '@/lib/income';
import { GRID_TEMPLATE_CLASS } from '../_lib/layout';

import IncomeLogRow from './IncomeLogRow';
import LoadingState from './LoadingState';
import PaginationControls from './PaginationControls';

export type IncomeTableProps = {
  isLoading: boolean;
  incomeTable: Table<DailyIncomeSummary>;
  pageRows: Row<DailyIncomeSummary>[];
  currency: CurrencyCode;
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
  expandedRows: Set<string>;
  onToggleRow: (rowId: string) => void;
};

export default function IncomeTable({
  isLoading,
  incomeTable,
  pageRows,
  currency,
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
  expandedRows,
  onToggleRow,
}: IncomeTableProps) {
  return (
    <section className='rounded-lg border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
      {isLoading ? (
        <LoadingState message='Loading logs…' />
      ) : !hasEntriesForSelectedMonth ? (
        <div className='flex min-h-60 flex-col items-center justify-center gap-3 text-sm text-base-content/60'>
          <span
            className='fa-solid fa-coins text-4xl text-base-content/20'
            aria-hidden='true'
          />
          <p>{emptyMonthMessage}</p>
          <p className='text-xs text-base-content/60'>
            {hasAnyIncome
              ? 'Adjust your filters or add an income entry to fill the timeframe.'
              : 'Hit the button above to log your first income.'}
          </p>
          <button
            type='button'
            className='btn btn-sm btn-outline'
            onClick={onCreateEntry}
          >
            <span className='fa-solid fa-plus mr-2' aria-hidden='true' />
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
              <IncomeLogRow
                key={row.id}
                row={row}
                currency={currency}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
                deleteDisabled={deleteDisabled}
                isExpanded={expandedRows.has(row.id)}
                onToggle={() => onToggleRow(row.id)}
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
