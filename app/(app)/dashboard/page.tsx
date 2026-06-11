"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { TimeframeProvider } from "@/lib/contexts/timeframe-context";
import { TIMEFRAME_OPTIONS, type TimeframeKey } from "@/lib/dates";
import { WidgetGrid } from "./_components/widget-grid";

const VALID_TIMEFRAMES = new Set(TIMEFRAME_OPTIONS.map((o) => o.value));

export default function DashboardPage() {
  const layout = useQuery(api.dashboardLayout.getMine);
  const save = useMutation(api.dashboardLayout.save);
  const persistTimeframe = useCallback(
    (timeframe: TimeframeKey) => {
      void save({ timeframe });
    },
    [save],
  );

  if (layout === undefined) return <DashboardLoading />;

  const stored = layout?.timeframe;
  const initial: TimeframeKey =
    stored && VALID_TIMEFRAMES.has(stored as TimeframeKey)
      ? (stored as TimeframeKey)
      : "monthly";

  return (
    <TimeframeProvider initial={initial} onChange={persistTimeframe}>
      <WidgetGrid saved={layout ?? null} />
    </TimeframeProvider>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["a", "b", "c", "d", "e", "f"].map((k) => (
          <Skeleton key={k} className="h-48" />
        ))}
      </div>
    </div>
  );
}
