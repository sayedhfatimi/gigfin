import type { ExpenseEntry } from '@/lib/expenses';
import type { IncomeEntry } from '@/lib/income';
import type { OdometerEntry } from '@/lib/odometer';

export type CombinedTransaction =
  | { type: 'income'; entry: IncomeEntry; date: string }
  | { type: 'expense'; entry: ExpenseEntry; date: string }
  | { type: 'odometer'; entry: OdometerEntry; date: string };

export type DeletableEntry = CombinedTransaction;

export type ExpenseSortColumn = 'date' | 'type' | 'amount';

export type ExpenseSortState = null | {
  column: ExpenseSortColumn;
  direction: 'asc' | 'desc';
};
