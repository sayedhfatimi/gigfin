"use client";

import { useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import { SelectField } from "@/components/select-field";
import { api } from "@/convex/_generated/api";
import { groupByDay } from "@/lib/daily";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { formatDistance, totalDistance } from "@/lib/odometer";
import { ActiveMileageCard } from "./active-mileage-card";
import { DayGroupTable } from "./day-group-table";
import { MileageEntryRow } from "./entry-rows";
import { LogEmptyState, LogSkeleton } from "./log-empty-state";
import { LogsToolbar } from "./logs-toolbar";
import { matchesText, useLogFilters, withinRange } from "./use-log-filters";

export function MileagePanel({
  odometerUnit,
  active,
}: {
  odometerUnit: string;
  active: boolean;
}) {
  const rows = useQuery(api.odometers.list);
  const vehicles = useQuery(api.vehicles.list);
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
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

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
      {rows === undefined ? (
        <LogSkeleton />
      ) : filtered.length === 0 ? (
        <LogEmptyState message="No mileage matches these filters." />
      ) : (
        <DayGroupTable
          groups={groups}
          renderSummary={(g) =>
            formatDistance(
              totalDistance(g.entries),
              odometerUnit as "km" | "mi",
            )
          }
          renderEntry={(r) => <MileageEntryRow row={r} unit={odometerUnit} />}
        />
      )}
    </div>
  );
}
