import type { ExpenseEntry } from '@/lib/expenses';
import { getCurrentMonthExpenses } from '@/lib/expenses';
import type { TimeframeKey } from './platformBreakdownTimeframes';

const normalizeStartOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const normalizeEndOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const parseEntryDate = (entry: ExpenseEntry) => {
  const parsed = new Date(entry.paidAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const filterEntriesBetween = (
  entries: ExpenseEntry[],
  start: Date,
  end: Date,
) =>
  entries.filter((entry) => {
    const entryDate = parseEntryDate(entry);
    if (!entryDate) {
      return false;
    }
    return entryDate >= start && entryDate <= end;
  });

const getRecentDaysEntries = (
  entries: ExpenseEntry[],
  days: number,
  reference = new Date(),
) => {
  const end = normalizeEndOfDay(reference);
  const start = normalizeStartOfDay(reference);
  start.setDate(start.getDate() - (days - 1));
  return filterEntriesBetween(entries, start, end);
};

const getYearToDateEntries = (
  entries: ExpenseEntry[],
  reference = new Date(),
) => {
  const start = new Date(reference.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);
  const end = normalizeEndOfDay(reference);
  return filterEntriesBetween(entries, start, end);
};

const getLastTwelveMonthsEntries = (
  entries: ExpenseEntry[],
  reference = new Date(),
) => {
  const start = new Date(reference.getFullYear(), reference.getMonth() - 11, 1);
  start.setHours(0, 0, 0, 0);
  const end = normalizeEndOfDay(reference);
  return filterEntriesBetween(entries, start, end);
};

export const getExpenseEntriesForTimeframe = (
  entries: ExpenseEntry[],
  timeframe: TimeframeKey,
) => {
  switch (timeframe) {
    case 'weekly':
      return getRecentDaysEntries(entries, 7);
    case 'monthly':
      return getCurrentMonthExpenses(entries);
    case 'yearToDate':
      return getYearToDateEntries(entries);
    case 'last12Months':
      return getLastTwelveMonthsEntries(entries);
    default:
      return entries;
  }
};
