"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDate, formatDuration, minutesToTime } from "@/lib/format";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ActiveShiftCard } from "./active-shift-card";
import { DataTable } from "./data-table";
import { ShiftForm } from "./forms/shift-form";
import { LogEmptyState } from "./log-empty-state";
import { LogsToolbar } from "./logs-toolbar";
import { DeleteButton, EditDialog } from "./row-actions";
import { SwipeableRow } from "./swipeable-row";
import { matchesText, useLogFilters, withinRange } from "./use-log-filters";

type Row = Doc<"shifts">;

const timeRange = (r: Row) =>
  `${minutesToTime(r.startMinutes)}–${r.endMinutes !== undefined ? minutesToTime(r.endMinutes) : "…"}`;

export function ShiftPanel({ active }: { active: boolean }) {
  const rows = useQuery(api.shifts.list);
  const remove = useMutation(api.shifts.remove);
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

  const del = (id: Id<"shifts">) => remove({ id });

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      id: "time",
      accessorKey: "startMinutes",
      header: "Time",
      cell: ({ row }) => (
        <span className="tabular-nums">{timeRange(row.original)}</span>
      ),
    },
    {
      id: "hours",
      accessorFn: (r) => r.durationMin ?? 0,
      header: "Hours",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatDuration(row.original.durationMin ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }) => row.original.platform ?? "—",
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <EditDialog title="Edit shift">
            {(close) => <ShiftForm initial={row.original} onDone={close} />}
          </EditDialog>
          <DeleteButton onDelete={() => del(row.original._id)} />
        </div>
      ),
    },
  ];

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
      {filtered.length === 0 ? (
        <LogEmptyState message="No shifts match these filters." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          renderCard={(r) => (
            <SwipeableRow
              onDelete={() => {
                del(r._id).catch(() => toast.error("Failed to delete"));
              }}
            >
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium tabular-nums">
                    {formatDuration(r.durationMin ?? 0)}
                  </p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {formatDate(r.date)} · {timeRange(r)}
                    {r.platform ? ` · ${r.platform}` : ""}
                  </p>
                </div>
                <EditDialog title="Edit shift">
                  {(close) => <ShiftForm initial={r} onDone={close} />}
                </EditDialog>
              </div>
            </SwipeableRow>
          )}
        />
      )}
    </div>
  );
}
