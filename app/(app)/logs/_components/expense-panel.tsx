"use client";

import { useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import { SelectField } from "@/components/select-field";
import { api } from "@/convex/_generated/api";
import { EXPENSE_TYPES } from "@/convex/lib/constants";
import { groupByDay } from "@/lib/daily";
import { sumExpenseMinor } from "@/lib/expenses-agg";
import { formatMoney, titleCase } from "@/lib/format";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { DayGroupTable } from "./day-group-table";
import { ExpenseEntryRow } from "./entry-rows";
import { LogEmptyState, LogSkeleton } from "./log-empty-state";
import { LogsToolbar } from "./logs-toolbar";
import { matchesText, useLogFilters, withinRange } from "./use-log-filters";

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All categories" },
  ...EXPENSE_TYPES.map((t) => ({ value: t, label: titleCase(t) })),
];

export function ExpensePanel({
  currency,
  active,
}: {
  currency: string;
  active: boolean;
}) {
  const rows = useQuery(api.expenses.list);
  const { query, setQuery, from, setFrom, to, setTo } = useLogFilters();
  const [typeFilter, setTypeFilter] = useState("all");
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
          (typeFilter === "all" || r.expenseType === typeFilter) &&
          matchesText(`${titleCase(r.expenseType)} ${r.notes ?? ""}`, query),
      ),
    [rows, from, to, query, typeFilter],
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
        extra={
          <SelectField
            className="w-44"
            value={typeFilter}
            onValueChange={setTypeFilter}
            options={TYPE_FILTER_OPTIONS}
          />
        }
      />
      {rows === undefined ? (
        <LogSkeleton />
      ) : filtered.length === 0 ? (
        <LogEmptyState message="No expenses match these filters." />
      ) : (
        <DayGroupTable
          groups={groups}
          renderSummary={(g) =>
            formatMoney(sumExpenseMinor(g.entries), currency)
          }
          renderEntry={(r) => <ExpenseEntryRow row={r} currency={currency} />}
        />
      )}
    </div>
  );
}
