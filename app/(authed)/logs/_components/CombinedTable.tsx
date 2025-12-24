'use client';

import type { ReactNode } from 'react';

import type { CurrencyCode } from '@/lib/currency';
import type { ExpenseEntry } from '@/lib/expenses';
import { formatExpenseType } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import { formatCurrency } from '@/lib/income';
import {
  formatOdometerDistance,
  formatOdometerReading,
  getOdometerDistance,
  type OdometerEntry,
  type OdometerUnit,
} from '@/lib/odometer';
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
  onEditOdometer: (entry: OdometerEntry) => void;
  onDeleteEntry: (entry: DeletableEntry) => void;
  odometerUnit: OdometerUnit;
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
  onEditOdometer,
  onDeleteEntry,
  odometerUnit,
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
            let label = 'Unknown';
            let variant: 'income' | 'expense' | 'odometer' = 'income';
            let primaryText = '';
            let secondaryText: string | undefined;
            let vehicleLabel: string | undefined;

            if (item.type === 'income') {
              label = item.entry.platform;
              variant = 'income';
              primaryText = formatCurrency(item.entry.amount, currency);
            } else if (item.type === 'expense') {
              label = formatExpenseType(item.entry.expenseType);
              variant = 'expense';
              primaryText = formatCurrency(
                item.entry.amountMinor / 100,
                currency,
              );
              secondaryText = formatExpenseRate(item.entry);
              vehicleLabel = item.entry.vehicle?.label;
            } else if (item.type === 'odometer') {
              label = item.entry.vehicle?.label ?? 'Odometer';
              variant = 'odometer';
              const distance = getOdometerDistance(item.entry);
              primaryText = formatOdometerDistance(distance, odometerUnit);
              secondaryText = `Start ${formatOdometerReading(
                item.entry.startReading,
                odometerUnit,
              )} · End ${formatOdometerReading(
                item.entry.endReading,
                odometerUnit,
              )}`;
              vehicleLabel = item.entry.vehicle?.label ?? undefined;
            }

            const handleEdit = () => {
              if (item.type === 'income') {
                onEditIncome(item.entry);
                return;
              }
              if (item.type === 'expense') {
                onEditExpense(item.entry);
                return;
              }
              onEditOdometer(item.entry);
            };

            return (
              <CombinedTransactionCard
                key={`${item.type}-${item.entry.id}`}
                label={label}
                dateLabel={formatDateLabel(item.date)}
                vehicleLabel={vehicleLabel}
                primaryText={primaryText}
                secondaryText={secondaryText}
                variant={variant}
                onEdit={handleEdit}
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
