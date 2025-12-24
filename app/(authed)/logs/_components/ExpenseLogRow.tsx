import type { CurrencyCode } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import { formatExpenseType } from '@/lib/expenses';
import { formatCurrency } from '@/lib/income';

import { formatDateLabel, formatExpenseRate } from '../_lib/formatters';
import EntryActions from './EntryActions';

type ExpenseLogRowProps = {
  entry: ExpenseEntry;
  currency: CurrencyCode;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (entry: ExpenseEntry) => void;
  onDelete: (entry: ExpenseEntry) => void;
  deleteDisabled: boolean;
};

export default function ExpenseLogRow({
  entry,
  currency,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  deleteDisabled,
}: ExpenseLogRowProps) {
  const expenseTypeLabel = formatExpenseType(entry.expenseType);
  const amountText = formatCurrency(entry.amountMinor / 100, currency);

  return (
    <div className='space-y-0.5'>
      <div className='border border-base-content/10 bg-base-200/80 shadow-sm'>
        <button
          type='button'
          className='flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:bg-base-100 md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center'
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <span className='min-w-0 flex-1 text-sm font-semibold text-base-content/80'>
            {formatDateLabel(entry.paidAt)}
          </span>
          <span
            className='hidden min-w-0 max-w-48 truncate text-sm font-semibold text-base-content/80 md:max-w-none md:block'
            title={expenseTypeLabel}
          >
            {expenseTypeLabel}
          </span>
          <span className='min-w-0 text-right text-sm font-semibold text-error'>
            -{amountText}
          </span>
          <span
            aria-hidden='true'
            className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} ml-auto text-xs text-base-content/60`}
          />
        </button>
        {isExpanded && (
          <div className='border-t border-base-content/10 bg-base-100 p-4 text-sm text-base-content/70'>
            <div className='grid gap-3 md:grid-cols-5 items-center'>
              <div>
                <p className='text-xs uppercase text-base-content/60'>
                  Vehicle
                </p>
                <p className='text-sm text-base-content'>
                  {entry.vehicle?.label ?? '—'}
                </p>
              </div>
              <div>
                <p className='text-xs uppercase text-base-content/60'>Type</p>
                <p className='text-sm text-base-content'>
                  {expenseTypeLabel}
                </p>
              </div>
              <div>
                <p className='text-xs uppercase text-base-content/60'>Rate</p>
                <p className='text-sm text-base-content'>
                  {formatExpenseRate(entry)}
                </p>
              </div>
              <div>
                <p className='text-xs uppercase text-base-content/60'>Notes</p>
                <p className='text-sm text-base-content/70 wrap-break-word'>
                  {entry.notes ?? '—'}
                </p>
              </div>
              <div className='flex flex-wrap gap-2 justify-end'>
                <EntryActions
                  onEdit={() => onEdit(entry)}
                  onDelete={() => onDelete(entry)}
                  deleteDisabled={deleteDisabled}
                  editClassName='btn btn-xs btn-outline btn-ghost'
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
