'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getTimeframeRange,
  isInRange,
  parseDate,
  type TimeframeKey,
  timeframeOptions,
} from '@/lib/dates';

const STORAGE_KEY_PREFIX = 'gigfin-timeframe-';

type UseTimeframeFilterOptions<T> = {
  /** Storage key suffix for persisting selection */
  storageKey?: string;
  /** Default timeframe if none stored */
  defaultTimeframe?: TimeframeKey;
  /** Function to extract date from entry */
  getEntryDate: (entry: T) => string | Date | null | undefined;
  /** Reference date for calculations (defaults to now) */
  referenceDate?: Date;
};

type UseTimeframeFilterResult<T> = {
  /** Current selected timeframe */
  timeframe: TimeframeKey;
  /** Set the timeframe */
  setTimeframe: (timeframe: TimeframeKey) => void;
  /** Current timeframe option metadata */
  selectedOption: (typeof timeframeOptions)[number];
  /** Filter entries by current timeframe */
  filterEntries: (entries: T[]) => T[];
  /** Filtered entries (if data provided) */
  filteredEntries: T[];
  /** Date range for current timeframe */
  dateRange: { start: Date; end: Date };
  /** All available timeframe options */
  options: typeof timeframeOptions;
};

/**
 * Hook for consistent timeframe filtering across components
 */
export function useTimeframeFilter<T>(
  options: UseTimeframeFilterOptions<T>,
  data: T[] = [],
): UseTimeframeFilterResult<T> {
  const {
    storageKey,
    defaultTimeframe = 'monthly',
    getEntryDate,
    referenceDate = new Date(),
  } = options;

  const fullStorageKey = storageKey
    ? `${STORAGE_KEY_PREFIX}${storageKey}`
    : null;

  const [timeframe, setTimeframeState] =
    useState<TimeframeKey>(defaultTimeframe);

  // Load from localStorage on mount
  useEffect(() => {
    if (!fullStorageKey || typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(fullStorageKey);
    if (stored && timeframeOptions.some((opt) => opt.value === stored)) {
      setTimeframeState(stored as TimeframeKey);
    }
  }, [fullStorageKey]);

  // Persist to localStorage on change
  const setTimeframe = useCallback(
    (newTimeframe: TimeframeKey) => {
      setTimeframeState(newTimeframe);
      if (fullStorageKey && typeof window !== 'undefined') {
        window.localStorage.setItem(fullStorageKey, newTimeframe);
      }
    },
    [fullStorageKey],
  );

  const selectedOption = useMemo(
    () =>
      timeframeOptions.find((opt) => opt.value === timeframe) ??
      timeframeOptions[3],
    [timeframe],
  );

  const dateRange = useMemo(
    () => getTimeframeRange(timeframe, referenceDate),
    [timeframe, referenceDate],
  );

  const filterEntries = useCallback(
    (entries: T[]): T[] => {
      if (timeframe === 'all') return entries;

      const { start, end } = dateRange;

      return entries.filter((entry) => {
        const dateValue = getEntryDate(entry);
        const parsed = parseDate(dateValue);
        if (!parsed) return false;
        return isInRange(parsed, start, end);
      });
    },
    [dateRange, getEntryDate, timeframe],
  );

  const filteredEntries = useMemo(
    () => filterEntries(data),
    [data, filterEntries],
  );

  return {
    timeframe,
    setTimeframe,
    selectedOption,
    filterEntries,
    filteredEntries,
    dateRange,
    options: timeframeOptions,
  };
}

/**
 * Hook for income entries timeframe filtering
 */
export function useIncomeTimeframeFilter(
  incomes: Array<{ date: string }> = [],
  storageKey?: string,
  defaultTimeframe: TimeframeKey = 'monthly',
) {
  return useTimeframeFilter<{ date: string }>(
    {
      storageKey,
      defaultTimeframe,
      getEntryDate: (entry) => entry.date,
    },
    incomes,
  );
}

/**
 * Hook for expense entries timeframe filtering
 */
export function useExpenseTimeframeFilter(
  expenses: Array<{ paidAt: string }> = [],
  storageKey?: string,
  defaultTimeframe: TimeframeKey = 'monthly',
) {
  return useTimeframeFilter<{ paidAt: string }>(
    {
      storageKey,
      defaultTimeframe,
      getEntryDate: (entry) => entry.paidAt,
    },
    expenses,
  );
}
