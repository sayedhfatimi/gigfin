"use client";

import { useQuery } from "convex/react";
import { useMemo, useRef } from "react";
import { api } from "@/convex/_generated/api";
import { groupByDay } from "@/lib/daily";
import { formatMoney } from "@/lib/format";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { sumIncomeMinor } from "@/lib/income";
import { DayGroupTable } from "./day-group-table";
import { IncomeEntryRow } from "./entry-rows";
import { LogEmptyState, LogSkeleton } from "./log-empty-state";
import { LogsToolbar } from "./logs-toolbar";
import { matchesText, useLogFilters, withinRange } from "./use-log-filters";

export function IncomePanel({
  currency,
  active,
}: {
  currency: string;
  active: boolean;
}) {
  const rows = useQuery(api.income.list);
  const { query, setQuery, from, setFrom, to, setTo } = useLogFilters();
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcuts({
    enabled: active,
    onSearch: () => searchRef.current?.focus(),
  });

  const filtered = useMemo(
    () =>
      (rows ?? []).filter(
        (r) => withinRange(r.date, from, to) && matchesText(r.platform, query),
      ),
    [rows, from, to, query],
  );
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="space-y-4">
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
        <LogEmptyState message="No income matches these filters." />
      ) : (
        <DayGroupTable
          groups={groups}
          renderSummary={(g) =>
            formatMoney(sumIncomeMinor(g.entries), currency)
          }
          renderEntry={(r) => <IncomeEntryRow row={r} currency={currency} />}
        />
      )}
    </div>
  );
}
