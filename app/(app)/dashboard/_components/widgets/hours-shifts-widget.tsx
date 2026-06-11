"use client";

import { timeframeLabel } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Hours worked, shift count and average shift length. Global.
export function HoursShiftsWidget({ data }: WidgetProps) {
  const minutes = data.scoped.workedMinutes;
  const shifts = data.scoped.shifts.length;
  const avg = shifts > 0 ? Math.round(minutes / shifts) : 0;

  const rows = [
    { label: "Hours worked", value: formatDuration(minutes) },
    { label: "Shifts", value: String(shifts) },
    { label: "Avg shift", value: shifts > 0 ? formatDuration(avg) : "—" },
  ];

  return (
    <WidgetCard title="Hours & shifts" caption={timeframeLabel(data.timeframe)}>
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
