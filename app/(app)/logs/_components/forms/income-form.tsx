"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { parseMoneyToMinor, todayISO } from "@/lib/format";
import { EntryForm, Field } from "../form-primitives";
import { usePlatformSuggestions } from "./hooks";

export function IncomeForm({
  onDone,
  initial,
}: {
  onDone: () => void;
  initial?: Doc<"income">;
}) {
  const add = useMutation(api.income.add);
  const update = useMutation(api.income.update);
  const platforms = usePlatformSuggestions();
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [amount, setAmount] = useState(
    initial ? (initial.amountMinor / 100).toString() : "",
  );
  const [date, setDate] = useState(initial?.date ?? todayISO());

  return (
    <EntryForm
      submitLabel={initial ? "Save changes" : "Add income"}
      onSubmit={async () => {
        const amountMinor = parseMoneyToMinor(amount);
        if (!platform.trim() || amountMinor === null) {
          toast.error("Enter a platform and amount.");
          return false;
        }
        const fields = { platform: platform.trim(), amountMinor, date };
        if (initial) await update({ id: initial._id, ...fields });
        else await add(fields);
        return true;
      }}
      onDone={onDone}
    >
      <Field label="Platform">
        <Input
          list="income-platform-suggestions"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        />
        <datalist id="income-platform-suggestions">
          {platforms.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
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
    </EntryForm>
  );
}
