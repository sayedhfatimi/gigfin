"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { SelectField } from "@/components/select-field";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { todayISO } from "@/lib/format";
import { EntryForm, Field } from "../form-primitives";
import { useVehicleField } from "./hooks";

export function MileageForm({
  onDone,
  initial,
}: {
  onDone: () => void;
  initial?: Doc<"odometers">;
}) {
  const add = useMutation(api.odometers.add);
  const update = useMutation(api.odometers.update);
  const { vehicles, vehicleId, setVehicleId } = useVehicleField(
    initial?.vehicleId,
  );

  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [start, setStart] = useState(initial?.startReading?.toString() ?? "");
  const [end, setEnd] = useState(initial?.endReading?.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <EntryForm
      submitLabel={initial ? "Save changes" : "Add mileage"}
      onSubmit={async () => {
        const s = Number.parseFloat(start);
        const e = Number.parseFloat(end);
        if (!Number.isFinite(s) || !Number.isFinite(e)) {
          toast.error("Enter start and end readings.");
          return false;
        }
        const fields = {
          date,
          startReading: s,
          endReading: e,
          vehicleId:
            vehicleId !== "none" ? (vehicleId as Id<"vehicles">) : undefined,
          notes: notes.trim() || undefined,
        };
        if (initial) await update({ id: initial._id, ...fields });
        else await add(fields);
        return true;
      }}
      onDone={onDone}
    >
      <Field label="Date">
        <DatePicker value={date} onChange={setDate} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start">
          <Input
            inputMode="decimal"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field label="End">
          <Input
            inputMode="decimal"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
      </div>
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
      <Field label="Notes">
        <Input
          placeholder="Optional"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
    </EntryForm>
  );
}
