"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { SelectField } from "@/components/select-field";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { EXPENSE_TYPES } from "@/convex/lib/constants";
import { parseMoneyToMinor, titleCase, todayISO } from "@/lib/format";
import { EntryForm, Field } from "../form-primitives";
import { useVehicleField } from "./hooks";

const TYPE_OPTIONS = EXPENSE_TYPES.map((t) => ({
  value: t,
  label: titleCase(t),
}));

export function ExpenseForm({
  onDone,
  initial,
}: {
  onDone: () => void;
  initial?: Doc<"expenses">;
}) {
  const add = useMutation(api.expenses.add);
  const update = useMutation(api.expenses.update);
  const { vehicles, vehicleId, setVehicleId } = useVehicleField(
    initial?.vehicleId,
  );

  const [expenseType, setExpenseType] = useState<
    (typeof EXPENSE_TYPES)[number]
  >(initial?.expenseType ?? EXPENSE_TYPES[0]);
  const [amount, setAmount] = useState(
    initial ? (initial.amountMinor / 100).toString() : "",
  );
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <EntryForm
      submitLabel={initial ? "Save changes" : "Add expense"}
      onSubmit={async () => {
        const amountMinor = parseMoneyToMinor(amount);
        if (amountMinor === null) {
          toast.error("Enter an amount.");
          return false;
        }
        // Carry through optional fields not surfaced in the form so editing
        // never silently clears them.
        const fields = {
          expenseType,
          amountMinor,
          date,
          vehicleId:
            vehicleId !== "none" ? (vehicleId as Id<"vehicles">) : undefined,
          notes: notes.trim() || undefined,
          unitRateMinor: initial?.unitRateMinor,
          unitRateUnit: initial?.unitRateUnit,
        };
        if (initial) await update({ id: initial._id, ...fields });
        else await add(fields);
        return true;
      }}
      onDone={onDone}
    >
      <Field label="Category">
        <SelectField
          value={expenseType}
          onValueChange={(v) =>
            setExpenseType(v as (typeof EXPENSE_TYPES)[number])
          }
          options={TYPE_OPTIONS}
        />
      </Field>
      <Field label="Amount">
        <Input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label="Date">
        <DatePicker value={date} onChange={setDate} />
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
