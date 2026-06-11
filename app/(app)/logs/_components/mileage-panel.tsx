"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/select-field";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDate } from "@/lib/format";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { distanceOf } from "@/lib/odometer";
import { ActiveMileageCard } from "./active-mileage-card";
import { DataTable } from "./data-table";
import { MileageForm } from "./forms/mileage-form";
import { LogEmptyState } from "./log-empty-state";
import { LogsToolbar } from "./logs-toolbar";
import { DeleteButton, EditDialog } from "./row-actions";
import { SwipeableRow } from "./swipeable-row";
import { matchesText, useLogFilters, withinRange } from "./use-log-filters";

type Row = Doc<"odometers">;

export function MileagePanel({
  odometerUnit,
  active,
}: {
  odometerUnit: string;
  active: boolean;
}) {
  const rows = useQuery(api.odometers.list);
  const vehicles = useQuery(api.vehicles.list);
  const remove = useMutation(api.odometers.remove);
  const openReading = (rows ?? []).find((r) => r.endReading === undefined);
  const { query, setQuery, from, setFrom, to, setTo } = useLogFilters();
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcuts({
    enabled: active,
    onSearch: () => searchRef.current?.focus(),
  });

  const vehicleMap = useMemo(
    () => new Map((vehicles ?? []).map((v) => [v._id, v.label])),
    [vehicles],
  );
  const vehicleLabel = (id?: Id<"vehicles">) =>
    id ? (vehicleMap.get(id) ?? "—") : "—";

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const label = r.vehicleId ? (vehicleMap.get(r.vehicleId) ?? "") : "";
        return (
          withinRange(r.date, from, to) &&
          (vehicleFilter === "all" || r.vehicleId === vehicleFilter) &&
          matchesText(`${label} ${r.notes ?? ""}`, query)
        );
      }),
    [rows, from, to, query, vehicleFilter, vehicleMap],
  );

  const del = (id: Id<"odometers">) => remove({ id });

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      id: "vehicle",
      accessorFn: (r) => vehicleLabel(r.vehicleId),
      header: "Vehicle",
    },
    {
      id: "distance",
      accessorFn: (r) => distanceOf(r),
      header: `Distance (${odometerUnit})`,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {distanceOf(row.original).toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <EditDialog title="Edit mileage">
            {(close) => <MileageForm initial={row.original} onDone={close} />}
          </EditDialog>
          <DeleteButton onDelete={() => del(row.original._id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {openReading && (
        <ActiveMileageCard reading={openReading} unit={odometerUnit} />
      )}
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
            value={vehicleFilter}
            onValueChange={setVehicleFilter}
            options={[
              { value: "all", label: "All vehicles" },
              ...(vehicles ?? []).map((v) => ({
                value: v._id,
                label: v.label,
              })),
            ]}
          />
        }
      />
      {filtered.length === 0 ? (
        <LogEmptyState message="No mileage matches these filters." />
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
                    {distanceOf(r).toLocaleString()} {odometerUnit}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(r.date)} · {vehicleLabel(r.vehicleId)}
                  </p>
                </div>
                <EditDialog title="Edit mileage">
                  {(close) => <MileageForm initial={r} onDone={close} />}
                </EditDialog>
              </div>
            </SwipeableRow>
          )}
        />
      )}
    </div>
  );
}
