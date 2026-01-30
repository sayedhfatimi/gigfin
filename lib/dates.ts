/**
 * Centralized date utilities for consistent parsing and formatting
 */

export const ONE_DAY_MS = 1000 * 60 * 60 * 24;
export const ONE_WEEK_MS = ONE_DAY_MS * 7;

/**
 * Parse a date string safely, returning null if invalid
 */
export const parseDate = (
  value: string | Date | null | undefined,
): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Format date as YYYY-MM-DD key
 */
export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get start of day (00:00:00.000)
 */
export const startOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Get end of day (23:59:59.999)
 */
export const endOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

/**
 * Get start of week (Monday 00:00:00.000)
 */
export const startOfWeek = (date: Date): Date => {
  const normalized = startOfDay(date);
  const day = normalized.getDay();
  const offset = (day + 6) % 7; // Monday = 0
  normalized.setDate(normalized.getDate() - offset);
  return normalized;
};

/**
 * Get start of month (1st day 00:00:00.000)
 */
export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

/**
 * Get start of year (Jan 1st 00:00:00.000)
 */
export const startOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (a: Date, b: Date): boolean => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

/**
 * Check if date is within range (inclusive)
 */
export const isInRange = (date: Date, start: Date, end: Date): boolean => {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
};

/**
 * Get number of days between two dates
 */
export const daysBetween = (start: Date, end: Date): number => {
  return Math.round((end.getTime() - start.getTime()) / ONE_DAY_MS);
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Subtract days from a date
 */
export const subtractDays = (date: Date, days: number): Date => {
  return addDays(date, -days);
};

/**
 * Get yesterday's date
 */
export const yesterday = (reference = new Date()): Date => {
  return subtractDays(startOfDay(reference), 1);
};

/**
 * Get date N days ago
 */
export const daysAgo = (n: number, reference = new Date()): Date => {
  return subtractDays(startOfDay(reference), n);
};

// Formatters
export const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});

export const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
});

export const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
});

export const shortMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
});

export const fullDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Format date for display
 */
export const formatDate = (
  date: Date,
  format: 'day' | 'weekday' | 'month' | 'short-month' | 'full' = 'day',
): string => {
  switch (format) {
    case 'day':
      return dayFormatter.format(date);
    case 'weekday':
      return weekdayFormatter.format(date);
    case 'month':
      return monthFormatter.format(date);
    case 'short-month':
      return shortMonthFormatter.format(date);
    case 'full':
      return fullDateFormatter.format(date);
    default:
      return dayFormatter.format(date);
  }
};

/**
 * Get relative time description
 */
export const getRelativeTime = (date: Date, reference = new Date()): string => {
  const refStart = startOfDay(reference);
  const dateStart = startOfDay(date);
  const diff = daysBetween(dateStart, refStart);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return 'Last week';
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 60) return 'Last month';
  return formatDate(date, 'month');
};

export type TimeframeKey =
  | 'today'
  | 'yesterday'
  | 'weekly'
  | 'monthly'
  | 'yearToDate'
  | 'last12Months'
  | 'all';

export type TimeframeOption = {
  value: TimeframeKey;
  label: string;
  description: string;
};

export const timeframeOptions: TimeframeOption[] = [
  { value: 'today', label: 'Today', description: "Today's activity" },
  {
    value: 'yesterday',
    label: 'Yesterday',
    description: "Yesterday's activity",
  },
  { value: 'weekly', label: 'This week', description: 'Monday to today' },
  {
    value: 'monthly',
    label: 'This month',
    description: 'Current calendar month',
  },
  { value: 'yearToDate', label: 'Year to date', description: 'Jan 1 to today' },
  {
    value: 'last12Months',
    label: 'Last 12 months',
    description: 'Rolling 12 months',
  },
  { value: 'all', label: 'All time', description: 'All recorded data' },
];

/**
 * Get date range for a timeframe
 */
export const getTimeframeRange = (
  timeframe: TimeframeKey,
  reference = new Date(),
): { start: Date; end: Date } => {
  const end = endOfDay(reference);

  switch (timeframe) {
    case 'today':
      return { start: startOfDay(reference), end };
    case 'yesterday': {
      const yesterdayDate = yesterday(reference);
      return { start: startOfDay(yesterdayDate), end: endOfDay(yesterdayDate) };
    }
    case 'weekly':
      return { start: startOfWeek(reference), end };
    case 'monthly':
      return { start: startOfMonth(reference), end };
    case 'yearToDate':
      return { start: startOfYear(reference), end };
    case 'last12Months': {
      const start = new Date(reference);
      start.setMonth(start.getMonth() - 12);
      return { start: startOfDay(start), end };
    }
    case 'all':
      return { start: new Date(0), end };
    default:
      return { start: startOfMonth(reference), end };
  }
};
