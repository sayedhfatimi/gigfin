"use client";

import { useMutation, useQuery } from "convex/react";
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

const UNIT_LABELS: Record<string, string> = {
  kwh: "kWh",
  litre: "litre",
  gallon_us: "US gal",
  gallon_imp: "imp gal",
};

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
  const vendors = useQuery(api.chargingVendors.list);

  const [expenseType, setExpenseType] = useState<
    (typeof EXPENSE_TYPES)[number]
  >(initial?.expenseType ?? EXPENSE_TYPES[0]);
  const [amount, setAmount] = useState(
    initial ? (initial.amountMinor / 100).toString() : "",
  );
  // Optional fuel/charging: tag the expense with a saved vendor. The user enters
  // the total amount paid; the vendor's unit rate is snapshotted for the record
  // (quantity is derivable as amount ÷ rate).
  const [vendorId, setVendorId] = useState<string>(initial?.vendorId ?? "none");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const isFuel = expenseType === "fuel_charging";
  const selectedVendor = vendors?.find((v) => v._id === vendorId);

  return (
    <EntryForm
      submitLabel={initial ? "Save changes" : "Add expense"}
      onSubmit={async () => {
        const amountMinor = parseMoneyToMinor(amount);
        if (amountMinor === null) {
          toast.error("Enter an amount.");
          return false;
        }
        const useVendor = isFuel && selectedVendor !== undefined;
        const fields = {
          expenseType,
          amountMinor,
          date,
          vehicleId:
            vehicleId !== "none" ? (vehicleId as Id<"vehicles">) : undefined,
          // Tag the chosen vendor (display + snapshot below); otherwise carry
          // through any existing reference so editing never silently clears it.
          vendorId: useVendor ? selectedVendor._id : initial?.vendorId,
          notes: notes.trim() || undefined,
          // Snapshot the unit rate from the chosen vendor; otherwise carry
          // through any existing value so editing never silently clears it.
          unitRateMinor: useVendor
            ? selectedVendor.unitRateMinor
            : initial?.unitRateMinor,
          unitRateUnit: useVendor
            ? selectedVendor.unitRateUnit
            : initial?.unitRateUnit,
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
      {isFuel && (vendors?.length ?? 0) > 0 && (
        <>
          <Field label="Charging vendor">
            <SelectField
              value={vendorId}
              onValueChange={setVendorId}
              options={[
                { value: "none", label: "No vendor" },
                ...(vendors ?? []).map((v) => ({
                  value: v._id,
                  label: `${v.label} · per ${UNIT_LABELS[v.unitRateUnit]}`,
                })),
              ]}
            />
          </Field>
        </>
      )}
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
