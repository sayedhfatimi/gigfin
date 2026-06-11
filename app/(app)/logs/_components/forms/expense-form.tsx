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
  // Optional fuel/charging convenience: pick a saved vendor + quantity and the
  // amount is computed from the vendor's unit rate.
  const [vendorId, setVendorId] = useState("none");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const isFuel = expenseType === "fuel_charging";
  const selectedVendor = vendors?.find((v) => v._id === vendorId);

  // Recompute the amount from the vendor rate × quantity (still editable after).
  function priceFrom(vid: string, qty: string) {
    const vendor = vendors?.find((v) => v._id === vid);
    const q = Number.parseFloat(qty);
    if (vendor && Number.isFinite(q)) {
      setAmount(((q * vendor.unitRateMinor) / 100).toFixed(2));
    }
  }

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
          notes: notes.trim() || undefined,
          // Set the unit rate from the chosen vendor; otherwise carry through
          // any existing value so editing never silently clears it.
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
              onValueChange={(v) => {
                setVendorId(v);
                priceFrom(v, quantity);
              }}
              options={[
                { value: "none", label: "Custom amount" },
                ...(vendors ?? []).map((v) => ({
                  value: v._id,
                  label: `${v.label} · per ${UNIT_LABELS[v.unitRateUnit]}`,
                })),
              ]}
            />
          </Field>
          {selectedVendor && (
            <Field
              label={`Quantity (${UNIT_LABELS[selectedVendor.unitRateUnit]})`}
            >
              <Input
                inputMode="decimal"
                placeholder="e.g. 42"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  priceFrom(vendorId, e.target.value);
                }}
              />
            </Field>
          )}
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
