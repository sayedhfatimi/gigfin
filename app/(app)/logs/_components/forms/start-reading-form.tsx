"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/select-field";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { localDateISO } from "@/lib/format";
import { EntryForm, Field } from "../form-primitives";

// Opens a live odometer reading (start only; end logged later).
export function StartReadingForm({ onDone }: { onDone: () => void }) {
  const start = useMutation(api.odometers.start);
  const vehicles = useQuery(api.vehicles.list);
  const [reading, setReading] = useState("");
  const [vehicleId, setVehicleId] = useState("none");

  return (
    <EntryForm
      submitLabel="Start reading"
      onSubmit={async () => {
        const value = Number.parseFloat(reading);
        if (!Number.isFinite(value)) {
          toast.error("Enter the start reading.");
          return false;
        }
        await start({
          date: localDateISO(),
          startReading: value,
          vehicleId:
            vehicleId !== "none" ? (vehicleId as Id<"vehicles">) : undefined,
        });
        return true;
      }}
      onDone={onDone}
    >
      <Field label="Start reading">
        <Input
          inputMode="decimal"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
        />
      </Field>
      <Field label="Vehicle">
        <SelectField
          value={vehicleId}
          onValueChange={setVehicleId}
          options={[
            { value: "none", label: "No vehicle" },
            ...(vehicles ?? []).map((v) => ({ value: v._id, label: v.label })),
          ]}
        />
      </Field>
    </EntryForm>
  );
}
