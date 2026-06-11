"use client";

import { useQuery } from "convex/react";
import { AddDialog } from "@/components/add-dialog";
import { api } from "@/convex/_generated/api";
import { MileageForm } from "./forms/mileage-form";
import { StartReadingForm } from "./forms/start-reading-form";

// Header actions for the Mileage tab: Log start (hidden while a reading is
// open) + manual entry.
export function MileageActions() {
  const rows = useQuery(api.odometers.list);
  const openReading = (rows ?? []).find((r) => r.endReading === undefined);

  return (
    <>
      {!openReading && (
        <AddDialog title="Log start reading" triggerLabel="Log start">
          {(close) => <StartReadingForm onDone={close} />}
        </AddDialog>
      )}
      <AddDialog title="Add mileage" triggerLabel="Add manually">
        {(close) => <MileageForm onDone={close} />}
      </AddDialog>
    </>
  );
}
