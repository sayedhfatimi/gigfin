"use client";

import { timeframeLabel } from "@/lib/dates";
import { formatDistance } from "@/lib/odometer";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Distance, trips and active vehicles over the active timeframe. Global.
export function DrivingStatsWidget({ data }: WidgetProps) {
  const trips = data.scoped.odometers.length;
  const vehicles = new Set(
    data.scoped.odometers.map((o) => o.vehicleId).filter(Boolean),
  ).size;

  const rows = [
    {
      label: "Distance",
      value: formatDistance(data.scoped.distance, data.odometerUnit),
    },
    { label: "Trips logged", value: String(trips) },
    { label: "Active vehicles", value: String(vehicles) },
  ];

  return (
    <WidgetCard title="Driving" caption={timeframeLabel(data.timeframe)}>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{r.label}</span>
            <span className="tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
