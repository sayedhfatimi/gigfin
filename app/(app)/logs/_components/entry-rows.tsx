"use client";

import { useMutation, useQuery } from "convex/react";
import { type ReactNode, useMemo } from "react";
import { toast } from "sonner";
import { ReceiptButton } from "@/components/receipt-button";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  formatDuration,
  formatMoney,
  minutesToTime,
  titleCase,
} from "@/lib/format";
import { distanceOf } from "@/lib/odometer";
import { ExpenseForm } from "./forms/expense-form";
import { IncomeForm } from "./forms/income-form";
import { MileageForm } from "./forms/mileage-form";
import { ShiftForm } from "./forms/shift-form";
import { DeleteButton, EditDialog } from "./row-actions";
import { SwipeableRow } from "./swipeable-row";

// One entry inside an expanded day group. The day header carries the date, so
// each row shows only the entry's distinguishing detail. Self-contained: each
// owns its remove mutation, edit dialog/form, and delete affordance, so panels
// and the Overview reuse them with no wiring. On mobile the row is also
// swipe-to-delete; the explicit DeleteButton covers desktop (no swipe there).
function EntryShell({
  onDelete,
  children,
}: {
  onDelete: () => Promise<unknown>;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const body = (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      {children}
    </div>
  );
  if (isMobile) {
    return (
      <SwipeableRow
        onDelete={() => {
          onDelete().catch(() => toast.error("Failed to delete"));
        }}
      >
        {body}
      </SwipeableRow>
    );
  }
  return body;
}

export function IncomeEntryRow({
  row,
  currency,
}: {
  row: Doc<"income">;
  currency: string;
}) {
  const remove = useMutation(api.income.remove);
  const del = () => remove({ id: row._id });
  return (
    <EntryShell onDelete={del}>
      <p className="font-medium">{row.platform}</p>
      <div className="flex items-center gap-1">
        <span className="tabular-nums">
          {formatMoney(row.amountMinor, currency)}
        </span>
        <EditDialog title="Edit income">
          {(close) => <IncomeForm initial={row} onDone={close} />}
        </EditDialog>
        <DeleteButton onDelete={del} />
      </div>
    </EntryShell>
  );
}

export function ExpenseEntryRow({
  row,
  currency,
}: {
  row: Doc<"expenses">;
  currency: string;
}) {
  const remove = useMutation(api.expenses.remove);
  const vendors = useQuery(api.chargingVendors.list);
  // Prefer the linked vendor's current label; fall back to free-text notes
  // (legacy/migrated rows carry the vendor name there).
  const subtitle = useMemo(() => {
    const vendorLabel = row.vendorId
      ? (vendors ?? []).find((v) => v._id === row.vendorId)?.label
      : undefined;
    return vendorLabel ?? row.notes;
  }, [vendors, row.vendorId, row.notes]);
  const del = () => remove({ id: row._id });
  return (
    <EntryShell onDelete={del}>
      <div>
        <p className="font-medium">{titleCase(row.expenseType)}</p>
        {subtitle ? (
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <span className="tabular-nums">
          {formatMoney(row.amountMinor, currency)}
        </span>
        <ReceiptButton expenseId={row._id} />
        <EditDialog title="Edit expense">
          {(close) => <ExpenseForm initial={row} onDone={close} />}
        </EditDialog>
        <DeleteButton onDelete={del} />
      </div>
    </EntryShell>
  );
}

export function MileageEntryRow({
  row,
  unit,
}: {
  row: Doc<"odometers">;
  unit: string;
}) {
  const remove = useMutation(api.odometers.remove);
  const vehicles = useQuery(api.vehicles.list);
  const vehicleLabel = useMemo(() => {
    if (!row.vehicleId) return "—";
    return (vehicles ?? []).find((v) => v._id === row.vehicleId)?.label ?? "—";
  }, [vehicles, row.vehicleId]);
  const del = () => remove({ id: row._id });
  return (
    <EntryShell onDelete={del}>
      <div>
        <p className="font-medium tabular-nums">
          {distanceOf(row).toLocaleString()} {unit}
        </p>
        <p className="text-muted-foreground text-xs">{vehicleLabel}</p>
      </div>
      <div className="flex items-center gap-1">
        <EditDialog title="Edit mileage">
          {(close) => <MileageForm initial={row} onDone={close} />}
        </EditDialog>
        <DeleteButton onDelete={del} />
      </div>
    </EntryShell>
  );
}

export function ShiftEntryRow({ row }: { row: Doc<"shifts"> }) {
  const remove = useMutation(api.shifts.remove);
  const del = () => remove({ id: row._id });
  const timeRange = `${minutesToTime(row.startMinutes)}–${
    row.endMinutes !== undefined ? minutesToTime(row.endMinutes) : "…"
  }`;
  return (
    <EntryShell onDelete={del}>
      <div>
        <p className="font-medium tabular-nums">
          {formatDuration(row.durationMin ?? 0)}
        </p>
        <p className="text-muted-foreground text-xs tabular-nums">
          {timeRange}
          {row.platform ? ` · ${row.platform}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <EditDialog title="Edit shift">
          {(close) => <ShiftForm initial={row} onDone={close} />}
        </EditDialog>
        <DeleteButton onDelete={del} />
      </div>
    </EntryShell>
  );
}
