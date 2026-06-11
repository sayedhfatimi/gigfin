"use client";

import { Settings2 } from "lucide-react";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { useTimeframe } from "@/lib/contexts/timeframe-context";
import { TIMEFRAME_OPTIONS, type TimeframeKey } from "@/lib/dates";

const OPTIONS = TIMEFRAME_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function DashboardHeader({
  isCustomizing,
  onCustomize,
  onDone,
  onReset,
}: {
  isCustomizing: boolean;
  onCustomize: () => void;
  onDone: () => void;
  onReset: () => void;
}) {
  const { timeframe, setTimeframe } = useTimeframe();

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {isCustomizing
            ? "Drag to reorder · hide a widget to move it to the tray below."
            : "Your earnings at a glance."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <SelectField
          className="w-40"
          value={timeframe}
          onValueChange={(v) => setTimeframe(v as TimeframeKey)}
          options={OPTIONS}
        />
        {isCustomizing ? (
          <>
            <Button variant="ghost" onClick={onReset}>
              Reset
            </Button>
            <Button onClick={onDone}>Done</Button>
          </>
        ) : (
          <Button variant="outline" onClick={onCustomize}>
            <Settings2 className="size-4" />
            Customize
          </Button>
        )}
      </div>
    </div>
  );
}
