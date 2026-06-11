"use client";

import { useMutation, useQuery } from "convex/react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { localDateISO, localNowMinutes } from "@/lib/format";
import { ShiftForm } from "./forms/shift-form";

// Header actions for the Shifts tab: one-tap Start (hidden while a shift is
// open) + manual entry.
export function ShiftActions() {
  const rows = useQuery(api.shifts.list);
  const start = useMutation(api.shifts.start);
  const openShift = (rows ?? []).find((r) => r.endMinutes === undefined);

  return (
    <>
      {!openShift && (
        <Button
          size="sm"
          onClick={() =>
            start({ date: localDateISO(), startMinutes: localNowMinutes() })
              .then(() => toast.success("Shift started"))
              .catch((err) =>
                toast.error(
                  err instanceof Error ? err.message : "Failed to start",
                ),
              )
          }
        >
          <Play className="size-4" />
          Start shift
        </Button>
      )}
      <AddDialog title="Add shift" triggerLabel="Add manually">
        {(close) => <ShiftForm onDone={close} />}
      </AddDialog>
    </>
  );
}
