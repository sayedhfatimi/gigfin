"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDuration, localNowMinutes, minutesToTime } from "@/lib/format";

// The in-progress shift, with a live elapsed timer and one-tap End.
export function ActiveShiftCard({ shift }: { shift: Doc<"shifts"> }) {
  const end = useMutation(api.shifts.end);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Same-day elapsed; the end mutation computes the real duration (with wrap).
  const elapsed = Math.max(0, localNowMinutes() - shift.startMinutes);

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <p className="font-medium">Shift in progress</p>
          <p className="text-muted-foreground text-sm tabular-nums">
            Started {minutesToTime(shift.startMinutes)} ·{" "}
            {formatDuration(elapsed)} elapsed
          </p>
        </div>
        <Button
          onClick={() =>
            end({ id: shift._id, endMinutes: localNowMinutes() })
              .then(() => toast.success("Shift ended"))
              .catch(() => toast.error("Failed to end shift"))
          }
        >
          End shift
        </Button>
      </CardContent>
    </Card>
  );
}
