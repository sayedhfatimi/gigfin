"use client";

import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { EXPENSE_TYPES, RECURRING_CADENCES } from "@/convex/lib/constants";
import {
  formatDate,
  formatMoney,
  parseMoneyToMinor,
  titleCase,
  todayISO,
} from "@/lib/format";

const TYPE_OPTIONS = EXPENSE_TYPES.map((t) => ({
  value: t,
  label: titleCase(t),
}));
const CADENCE_LABELS: Record<(typeof RECURRING_CADENCES)[number], string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};
const CADENCE_OPTIONS = RECURRING_CADENCES.map((c) => ({
  value: c,
  label: CADENCE_LABELS[c],
}));

export function RecurringCard({ currency }: { currency: string }) {
  const rows = useQuery(api.recurring.list);
  const add = useMutation(api.recurring.add);
  const setActive = useMutation(api.recurring.setActive);
  const remove = useMutation(api.recurring.remove);

  const [expenseType, setExpenseType] = useState<
    (typeof EXPENSE_TYPES)[number]
  >(EXPENSE_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] =
    useState<(typeof RECURRING_CADENCES)[number]>("monthly");
  const [nextDueDate, setNextDueDate] = useState(todayISO());

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amountMinor = parseMoneyToMinor(amount);
    if (amountMinor === null) {
      toast.error("Enter an amount.");
      return;
    }
    try {
      await add({ expenseType, amountMinor, cadence, nextDueDate });
      setAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring expenses</CardTitle>
        <CardDescription>
          Auto-logged on schedule (insurance, finance, subscriptions…).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor="recurring-type">Category</Label>
            <SelectField
              id="recurring-type"
              className="sm:w-44"
              value={expenseType}
              onValueChange={(v) =>
                setExpenseType(v as (typeof EXPENSE_TYPES)[number])
              }
              options={TYPE_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recurring-amount">Amount</Label>
            <Input
              id="recurring-amount"
              className="sm:w-28"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recurring-cadence">Cadence</Label>
            <SelectField
              id="recurring-cadence"
              className="sm:w-40"
              value={cadence}
              onValueChange={(v) =>
                setCadence(v as (typeof RECURRING_CADENCES)[number])
              }
              options={CADENCE_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recurring-next">Next due</Label>
            <Input
              id="recurring-next"
              className="sm:w-40"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>
          <Button type="submit">Add</Button>
        </form>

        {rows === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recurring expenses yet.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((r) => (
              <li
                key={r._id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 text-sm">
                  <span className="font-medium">
                    {formatMoney(r.amountMinor, currency)}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {titleCase(r.expenseType)} · {CADENCE_LABELS[r.cadence]} ·
                    next {formatDate(r.nextDueDate)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={r.active}
                      onChange={(e) =>
                        setActive({
                          id: r._id,
                          active: e.target.checked,
                        }).catch(() => toast.error("Failed to update"))
                      }
                    />
                    Active
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() =>
                      remove({ id: r._id }).catch(() =>
                        toast.error("Failed to delete"),
                      )
                    }
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
