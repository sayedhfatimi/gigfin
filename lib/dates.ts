// Timeframe ranges over ISO `YYYY-MM-DD` date strings. All entries store
// date-only ISO strings, so ranges are inclusive string bounds and filtering is
// plain lexicographic comparison — no Date objects or timezone drift at the
// boundary. Reimplemented from gigfin-old/lib/dates.ts (which returned Date
// objects); v2 stays in ISO strings throughout.

import { todayISO } from "./format";

export type TimeframeKey =
  | "today"
  | "yesterday"
  | "weekly"
  | "monthly"
  | "yearToDate"
  | "last12Months"
  | "all";

export type TimeframeOption = {
  value: TimeframeKey;
  label: string;
  description: string;
};

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { value: "today", label: "Today", description: "Today's activity" },
  {
    value: "yesterday",
    label: "Yesterday",
    description: "Yesterday's activity",
  },
  { value: "weekly", label: "This week", description: "Monday to today" },
  {
    value: "monthly",
    label: "This month",
    description: "Current calendar month",
  },
  { value: "yearToDate", label: "Year to date", description: "Jan 1 to today" },
  {
    value: "last12Months",
    label: "Last 12 months",
    description: "Rolling 12 months",
  },
  { value: "all", label: "All time", description: "All recorded data" },
];

// Inclusive ISO date range. `start` <= `end`, both `YYYY-MM-DD`.
export type DateRange = { start: string; end: string };

function toUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

export function getTimeframeRange(
  timeframe: TimeframeKey,
  reference: string = todayISO(),
): DateRange {
  const end = reference;
  switch (timeframe) {
    case "today":
      return { start: reference, end };
    case "yesterday": {
      const y = addDaysISO(reference, -1);
      return { start: y, end: y };
    }
    case "weekly": {
      const day = toUTC(reference).getUTCDay(); // 0=Sun..6=Sat
      const offset = (day + 6) % 7; // Monday = 0
      return { start: addDaysISO(reference, -offset), end };
    }
    case "monthly":
      return { start: `${reference.slice(0, 7)}-01`, end };
    case "yearToDate":
      return { start: `${reference.slice(0, 4)}-01-01`, end };
    case "last12Months": {
      const d = toUTC(reference);
      d.setUTCMonth(d.getUTCMonth() - 12);
      return { start: fromUTC(d), end };
    }
    case "all":
      return { start: "0000-01-01", end };
  }
}

// Inclusive membership test for an ISO date in a range.
export function inRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

// The label for the active timeframe (for "(this month)" style captions).
export function timeframeLabel(timeframe: TimeframeKey): string {
  return (
    TIMEFRAME_OPTIONS.find((o) => o.value === timeframe)?.label ?? "This month"
  );
}
