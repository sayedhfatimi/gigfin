"use client";

import { useQuery } from "convex/react";
import { useMemo, useRef } from "react";
import { api } from "@/convex/_generated/api";
import { groupByDay } from "@/lib/daily";
import { formatDuration } from "@/lib/format";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ActiveShiftCard } from "./active-shift-card";
import { DayGroupTable } from "./day-group-table";
import { ShiftEntryRow } from "./entry-rows";
import { LogEmptyState, LogSkeleton } from "./log-empty-state";
import { LogsToolbar } from "./logs-toolbar";
import { matchesText, useLogFilters, withinRange } from "./use-log-filters";

export function ShiftPanel({ active }: { active: boolean }) {
  const rows = useQuery(api.shifts.list);
  const openShift = (rows ?? []).find((r) => r.endMinutes === undefined);
  const { query, setQuery, from, setFrom, to, setTo } = useLogFilters();
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcuts({
    enabled: active,
    onSearch: () => searchRef.current?.focus(),
  });

  const filtered = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          withinRange(r.date, from, to) &&
          matchesText(`${r.platform ?? ""} ${r.notes ?? ""}`, query),
      ),
    [rows, from, to, query],
  );
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="space-y-4">
      {openShift && <ActiveShiftCard shift={openShift} />}
      <LogsToolbar
        searchRef={searchRef}
        query={query}
        onQuery={setQuery}
        from={from}
        onFrom={setFrom}
        to={to}
        onTo={setTo}
      />
      {rows === undefined ? (
        <LogSkeleton />
      ) : filtered.length === 0 ? (
        <LogEmptyState message="No shifts match these filters." />
      ) : (
        <DayGroupTable
          groups={groups}
          renderSummary={(g) =>
            formatDuration(
              g.entries.reduce((acc, r) => acc + (r.durationMin ?? 0), 0),
            )
          }
          renderEntry={(r) => <ShiftEntryRow row={r} />}
        />
      )}
    </div>
  );
}
