import type { IncomeEntry } from '@/lib/income';
import { getCurrentMonthEntries } from '@/lib/income';

export type TimeframeKey = 'weekly' | 'monthly' | 'yearToDate' | 'last12Months';

type TimeframeOption = {
  value: TimeframeKey;
  label: string;
};

export const timeframeOptions: TimeframeOption[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearToDate', label: 'Year to date' },
  { value: 'last12Months', label: 'Last 12 months' },
];

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

const parseEntryDate = (entry: IncomeEntry) => {
  const parsed = new Date(entry.date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const filterEntriesBetween = (entries: IncomeEntry[], start: Date, end: Date) =>
  entries.filter((entry) => {
    const entryDate = parseEntryDate(entry);
    if (!entryDate) {
      return false;
    }
    return entryDate >= start && entryDate <= end;
  });

const getRecentDaysEntries = (
  entries: IncomeEntry[],
  days: number,
  reference = new Date(),
) => {
  const end = normalizeEndOfDay(reference);
  const start = normalizeStartOfDay(reference);
  start.setDate(start.getDate() - (days - 1));
  return filterEntriesBetween(entries, start, end);
};

const getYearToDateEntries = (
  entries: IncomeEntry[],
  reference = new Date(),
) => {
  const start = new Date(reference.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);
  const end = normalizeEndOfDay(reference);
  return filterEntriesBetween(entries, start, end);
};

const getLastTwelveMonthsEntries = (
  entries: IncomeEntry[],
  reference = new Date(),
) => {
  const start = new Date(reference.getFullYear(), reference.getMonth() - 11, 1);
  start.setHours(0, 0, 0, 0);
  const end = normalizeEndOfDay(reference);
  return filterEntriesBetween(entries, start, end);
};

export const getEntriesForTimeframe = (
  entries: IncomeEntry[],
  timeframe: TimeframeKey,
) => {
  switch (timeframe) {
    case 'weekly':
      return getRecentDaysEntries(entries, 7);
    case 'monthly':
      return getCurrentMonthEntries(entries);
    case 'yearToDate':
      return getYearToDateEntries(entries);
    case 'last12Months':
      return getLastTwelveMonthsEntries(entries);
    default:
      return entries;
  }
};
