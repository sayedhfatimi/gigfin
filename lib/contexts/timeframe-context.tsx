"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { TimeframeKey } from "@/lib/dates";

type TimeframeContextValue = {
  timeframe: TimeframeKey;
  setTimeframe: (next: TimeframeKey) => void;
};

const TimeframeContext = createContext<TimeframeContextValue | null>(null);

// Holds the dashboard's global timeframe. `initial` is seeded from the user's
// saved layout; `onChange` lets the dashboard persist the choice back to Convex.
export function TimeframeProvider({
  initial = "monthly",
  onChange,
  children,
}: {
  initial?: TimeframeKey;
  onChange?: (next: TimeframeKey) => void;
  children: ReactNode;
}) {
  const [timeframe, setLocal] = useState<TimeframeKey>(initial);
  const setTimeframe = (next: TimeframeKey) => {
    setLocal(next);
    onChange?.(next);
  };
  return (
    <TimeframeContext.Provider value={{ timeframe, setTimeframe }}>
      {children}
    </TimeframeContext.Provider>
  );
}

export function useTimeframe(): TimeframeContextValue {
  const ctx = useContext(TimeframeContext);
  if (!ctx) {
    throw new Error("useTimeframe must be used within a TimeframeProvider");
  }
  return ctx;
}
