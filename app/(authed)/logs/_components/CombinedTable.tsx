'use client';

import type { ReactNode } from 'react';

import type { CurrencyCode } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import { formatExpenseType } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import { formatCurrency } from '@/lib/income';
import { formatDateLabel, formatExpenseRate } from '../_lib/formatters';
import type { CombinedTransaction, DeletableEntry } from '../_lib/types';

import CombinedTransactionCard from './CombinedTransactionCard';
import LoadingState from './LoadingState';
import PaginationControls from './PaginationControls';

export type CombinedTableProps = {
  currency: CurrencyCode;
  isLoading: boolean;
  transactions: CombinedTransaction[];
  vehicleFilterControl: ReactNode | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditIncome: (entry: IncomeEntry) => void;
  onEditExpense: (entry: ExpenseEntry) => void;
  onDeleteEntry: (entry: DeletableEntry) => void;
};

export default function CombinedTable({
  currency,
  isLoading,
  transactions,
  vehicleFilterControl,
  currentPage,
  totalPages,
  onPageChange,
  onEditIncome,
  onEditExpense,
  onDeleteEntry,
}: CombinedTableProps) {
  return (
    <section className='border border-base-content/10 bg-base-100 p-6 shadow-sm space-y-4'>
      {vehicleFilterControl && (
        <div className='flex flex-col gap-2 text-sm text-base-content/70 md:flex-row md:items-center md:justify-between'>
          <span className='text-xs uppercase'>Vehicles</span>
          <div>{vehicleFilterControl}</div>
        </div>
      )}
      {isLoading ? (
        <LoadingState message='Loading logs…' />
      ) : transactions.length === 0 ? (
        <div className='flex min-h-40 flex-col items-center justify-center text-sm text-base-content/60'>
          <p>No transactions yet. Add your first income or expense entry.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {transactions.map((item) => {
            const label =
              item.type === 'income'
                ? item.entry.platform
                : formatExpenseType(item.entry.expenseType);
            const amountText =
              item.type === 'income'
                ? formatCurrency(item.entry.amount, currency)
                : formatCurrency(item.entry.amountMinor / 100, currency);
            return (
              <CombinedTransactionCard
                key={`${item.type}-${item.entry.id}`}
                label={label}
                dateLabel={formatDateLabel(item.date)}
                vehicleLabel={
                  item.type === 'expense'
                    ? item.entry.vehicle?.label
                    : undefined
                }
                amountText={amountText}
                isIncome={item.type === 'income'}
                expenseRate={
                  item.type === 'expense'
                    ? formatExpenseRate(item.entry)
                    : undefined
                }
                onEdit={() =>
                  item.type === 'income'
                    ? onEditIncome(item.entry)
                    : onEditExpense(item.entry)
                }
                onDelete={() => onDeleteEntry(item)}
              />
            );
          })}
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
