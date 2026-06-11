"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

// An open odometer reading, with an inline input to log the end reading.
export function ActiveMileageCard({
  reading,
  unit,
}: {
  reading: Doc<"odometers">;
  unit: string;
}) {
  const end = useMutation(api.odometers.end);
  const [endReading, setEndReading] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const value = Number.parseFloat(endReading);
    if (!Number.isFinite(value)) {
      toast.error("Enter the end reading.");
      return;
    }
    setBusy(true);
    try {
      await end({ id: reading._id, endReading: value });
      toast.success("Reading closed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to close reading",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-wrap items-end justify-between gap-3 py-4">
        <div>
          <p className="font-medium">Open reading</p>
          <p className="text-muted-foreground text-sm tabular-nums">
            Started at {reading.startReading.toLocaleString()} {unit}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Input
            inputMode="decimal"
            className="w-32"
            placeholder={`End (${unit})`}
            value={endReading}
            onChange={(e) => setEndReading(e.target.value)}
          />
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Log end"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
