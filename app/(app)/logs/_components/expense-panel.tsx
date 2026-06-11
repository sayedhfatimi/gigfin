"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { ReceiptButton } from "@/components/receipt-button";
import { SelectField } from "@/components/select-field";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { EXPENSE_TYPES } from "@/convex/lib/constants";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { DataTable } from "./data-table";
import { ExpenseForm } from "./forms/expense-form";
import { LogEmptyState } from "./log-empty-state";
import { LogsToolbar } from "./logs-toolbar";
import { DeleteButton, EditDialog } from "./row-actions";
import { SwipeableRow } from "./swipeable-row";
import { matchesText, useLogFilters, withinRange } from "./use-log-filters";

type Row = Doc<"expenses">;

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
  const remove = useMutation(api.expenses.remove);
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

  const del = (id: Id<"expenses">) => remove({ id });

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "expenseType",
      header: "Category",
      cell: ({ row }) => titleCase(row.original.expenseType),
    },
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
          <ReceiptButton expenseId={row.original._id} />
          <EditDialog title="Edit expense">
            {(close) => <ExpenseForm initial={row.original} onDone={close} />}
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
        extra={
          <SelectField
            className="w-44"
            value={typeFilter}
            onValueChange={setTypeFilter}
            options={TYPE_FILTER_OPTIONS}
          />
        }
        action={
          <AddDialog title="Add expense">
            {(close) => <ExpenseForm onDone={close} />}
          </AddDialog>
        }
      />
      {filtered.length === 0 ? (
        <LogEmptyState message="No expenses match these filters." />
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
                  <p className="font-medium">{titleCase(r.expenseType)}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(r.date)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="tabular-nums">
                    {formatMoney(r.amountMinor, currency)}
                  </span>
                  <ReceiptButton expenseId={r._id} />
                  <EditDialog title="Edit expense">
                    {(close) => <ExpenseForm initial={r} onDone={close} />}
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
