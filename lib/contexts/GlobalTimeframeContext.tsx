'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getTimeframeRange,
  type TimeframeKey,
  timeframeOptions,
} from '@/lib/dates';

const STORAGE_KEY = 'gigfin-global-timeframe';

type GlobalTimeframeContextValue = {
  timeframe: TimeframeKey;
  setTimeframe: (timeframe: TimeframeKey) => void;
  selectedOption: (typeof timeframeOptions)[number];
  dateRange: { start: Date; end: Date };
  options: typeof timeframeOptions;
};

const GlobalTimeframeContext =
  createContext<GlobalTimeframeContextValue | null>(null);

type GlobalTimeframeProviderProps = {
  children: ReactNode;
  defaultTimeframe?: TimeframeKey;
};

export function GlobalTimeframeProvider({
  children,
  defaultTimeframe = 'monthly',
}: GlobalTimeframeProviderProps) {
  const [timeframe, setTimeframeState] =
    useState<TimeframeKey>(defaultTimeframe);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && timeframeOptions.some((opt) => opt.value === stored)) {
      setTimeframeState(stored as TimeframeKey);
    }
  }, []);

  const setTimeframe = useCallback((newTimeframe: TimeframeKey) => {
    setTimeframeState(newTimeframe);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, newTimeframe);
    }
  }, []);

  const selectedOption = useMemo(
    () =>
      timeframeOptions.find((opt) => opt.value === timeframe) ??
      timeframeOptions[3],
    [timeframe],
  );

  const dateRange = useMemo(() => getTimeframeRange(timeframe), [timeframe]);

  const value = useMemo<GlobalTimeframeContextValue>(
    () => ({
      timeframe,
      setTimeframe,
      selectedOption,
      dateRange,
      options: timeframeOptions,
    }),
    [timeframe, setTimeframe, selectedOption, dateRange],
  );

  return (
    <GlobalTimeframeContext.Provider value={value}>
      {children}
    </GlobalTimeframeContext.Provider>
  );
}

export function useGlobalTimeframe(): GlobalTimeframeContextValue {
  const context = useContext(GlobalTimeframeContext);
  if (!context) {
    throw new Error(
      'useGlobalTimeframe must be used within GlobalTimeframeProvider',
    );
  }
  return context;
}

/**
 * Optional hook that returns global timeframe if available, or local fallback
 */
export function useOptionalGlobalTimeframe(
  localTimeframe?: TimeframeKey,
): GlobalTimeframeContextValue | null {
  const context = useContext(GlobalTimeframeContext);

  // If context exists and no local override, use global
  if (context && !localTimeframe) {
    return context;
  }

  return null;
}
