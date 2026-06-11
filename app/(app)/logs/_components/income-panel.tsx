"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDate, formatMoney } from "@/lib/format";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { DataTable } from "./data-table";
import { IncomeForm } from "./forms/income-form";
import { LogEmptyState } from "./log-empty-state";
import { LogsToolbar } from "./logs-toolbar";
import { DeleteButton, EditDialog } from "./row-actions";
import { SwipeableRow } from "./swipeable-row";
import { matchesText, useLogFilters, withinRange } from "./use-log-filters";

type Row = Doc<"income">;

export function IncomePanel({
  currency,
  active,
}: {
  currency: string;
  active: boolean;
}) {
  const rows = useQuery(api.income.list);
  const remove = useMutation(api.income.remove);
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

  const del = (id: Id<"income">) => remove({ id });

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    { accessorKey: "platform", header: "Platform" },
    {
      accessorKey: "amountMinor",
      header: "Amount",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatMoney(row.original.amountMinor, currency)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <EditDialog title="Edit income">
            {(close) => <IncomeForm initial={row.original} onDone={close} />}
          </EditDialog>
          <DeleteButton onDelete={() => del(row.original._id)} />
        </div>
      ),
    },
  ];

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
        action={
          <AddDialog title="Add income">
            {(close) => <IncomeForm onDone={close} />}
          </AddDialog>
        }
      />
      {filtered.length === 0 ? (
        <LogEmptyState message="No income matches these filters." />
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
                  <p className="font-medium">{r.platform}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(r.date)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="tabular-nums">
                    {formatMoney(r.amountMinor, currency)}
                  </span>
                  <EditDialog title="Edit income">
                    {(close) => <IncomeForm initial={r} onDone={close} />}
                  </EditDialog>
                </div>
              </div>
            </SwipeableRow>
          )}
        />
      )}
    </div>
  );
}
