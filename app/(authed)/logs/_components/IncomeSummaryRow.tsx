import type { Row } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';

import type { CurrencyCode } from '@/lib/currency';
import type { DailyIncomeSummary, IncomeEntry } from '@/lib/income';
import { formatCurrency } from '@/lib/income';

import EntryActions from './EntryActions';

type IncomeSummaryRowProps = {
  row: Row<DailyIncomeSummary>;
  currency: CurrencyCode;
  onEditEntry: (entry: IncomeEntry) => void;
  onDeleteEntry: (entry: IncomeEntry) => void;
  deleteDisabled: boolean;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function IncomeSummaryRow({
  row,
  currency,
  onEditEntry,
  onDeleteEntry,
  deleteDisabled,
  isExpanded,
  onToggle,
}: IncomeSummaryRowProps) {
  return (
    <div className='space-y-0.5'>
      <div className='border border-base-content/10 bg-base-200/80 shadow-sm'>
        <button
          type='button'
          className='flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:bg-base-100 md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center'
          onClick={onToggle}
        >
          {row.getVisibleCells().map((cell) => {
            const isPlatformColumn = cell.column.id === 'breakdown';
            const isTotalColumn = cell.column.id === 'total';
            const classes = [
              'truncate',
              'text-sm',
              'font-semibold',
              'text-base-content/80',
              isPlatformColumn
                ? 'hidden md:block'
                : 'min-w-0 flex-1 md:flex-none',
              isTotalColumn ? 'text-right' : 'text-left',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={cell.id} className={classes}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            );
          })}
          <span
            aria-hidden='true'
            className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} ml-auto text-xs text-base-content/60`}
          />
        </button>
        {isExpanded && (
          <div className='border-t border-base-content/10 bg-base-100 p-4'>
            <div className='flex items-center justify-between text-sm font-semibold text-base-content/60'>
              <span>Entries</span>
              <span className='text-xs uppercase '>
                {row.original.entries.length}{' '}
                {row.original.entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <div className='mt-3 space-y-2 text-sm text-base-content/70'>
              {row.original.entries.length ? (
                row.original.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className='flex items-center justify-between border border-base-content/10 bg-base-200/80 px-3 py-2'
                  >
                    <div>
                      <p className='font-medium text-base-content'>
                        {entry.platform}
                      </p>
                      <p className='text-xs text-base-content/60'>
                        {formatCurrency(entry.amount, currency)}
                      </p>
                    </div>
                    <EntryActions
                      onEdit={() => onEditEntry(entry)}
                      onDelete={() => onDeleteEntry(entry)}
                      deleteDisabled={deleteDisabled}
                      editClassName='btn btn-xs btn-outline btn-ghost'
                    />
                  </div>
                ))
              ) : (
                <p className='text-xs text-base-content/50'>
                  No entries were recorded for this day.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
