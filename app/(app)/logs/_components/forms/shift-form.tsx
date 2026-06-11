"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { SelectField } from "@/components/select-field";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { minutesToTime, timeToMinutes, todayISO } from "@/lib/format";
import { EntryForm, Field } from "../form-primitives";
import { usePlatformSuggestions, useVehicleField } from "./hooks";

export function ShiftForm({
  onDone,
  initial,
}: {
  onDone: () => void;
  initial?: Doc<"shifts">;
}) {
  const add = useMutation(api.shifts.add);
  const update = useMutation(api.shifts.update);
  const { vehicles, vehicleId, setVehicleId } = useVehicleField(
    initial?.vehicleId,
  );
  const platforms = usePlatformSuggestions();

  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [start, setStart] = useState(
    initial ? minutesToTime(initial.startMinutes) : "09:00",
  );
  const [end, setEnd] = useState(
    initial?.endMinutes !== undefined
      ? minutesToTime(initial.endMinutes)
      : "17:00",
  );
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <EntryForm
      submitLabel={initial ? "Save changes" : "Add shift"}
      onSubmit={async () => {
        const s = timeToMinutes(start);
        const e = timeToMinutes(end);
        if (s === null || e === null) {
          toast.error("Enter valid start and end times.");
          return false;
        }
        const fields = {
          date,
          startMinutes: s,
          endMinutes: e,
          platform: platform.trim() || undefined,
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
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field label="End">
          <Input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Platform">
        <Input
          placeholder="Optional"
          list="shift-platform-suggestions"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        />
        <datalist id="shift-platform-suggestions">
          {platforms.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
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
