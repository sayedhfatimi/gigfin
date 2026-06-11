"use client";

import { useMutation, useQuery } from "convex/react";
import { Repeat, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DatePicker } from "@/components/date-picker";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
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

// Recurring-expense manager, opened from the Logs → Expenses tab. Templates are
// auto-logged on schedule (and on app load) by convex/recurring.
export function RecurringSheet({ currency }: { currency: string }) {
  const rows = useQuery(api.recurring.list);
  const setActive = useMutation(api.recurring.setActive);
  const remove = useMutation(api.recurring.remove);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <Repeat className="size-4" />
            Recurring
          </Button>
        }
      />
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Recurring expenses</SheetTitle>
          <SheetDescription>
            Auto-logged on schedule — insurance, finance, subscriptions.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4 pt-0">
          {rows === undefined ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
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
                    <ConfirmDialog
                      title="Delete this recurring expense?"
                      description="Already-logged entries are kept; no new ones will be created."
                      confirmLabel="Delete"
                      onConfirm={() =>
                        remove({ id: r._id }).catch(() =>
                          toast.error("Failed to delete"),
                        )
                      }
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Delete">
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <RecurringForm />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RecurringForm() {
  const add = useMutation(api.recurring.add);
  const [expenseType, setExpenseType] = useState<
    (typeof EXPENSE_TYPES)[number]
  >(EXPENSE_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] =
    useState<(typeof RECURRING_CADENCES)[number]>("monthly");
  const [nextDueDate, setNextDueDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amountMinor = parseMoneyToMinor(amount);
    if (amountMinor === null) {
      toast.error("Enter an amount.");
      return;
    }
    setBusy(true);
    try {
      await add({ expenseType, amountMinor, cadence, nextDueDate });
      setAmount("");
      toast.success("Recurring expense added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4">
      <p className="font-medium text-sm">Add recurring expense</p>
      <div className="space-y-1.5">
        <Label htmlFor="recurring-type">Category</Label>
        <SelectField
          id="recurring-type"
          value={expenseType}
          onValueChange={(v) =>
            setExpenseType(v as (typeof EXPENSE_TYPES)[number])
          }
          options={TYPE_OPTIONS}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recurring-amount">Amount</Label>
          <Input
            id="recurring-amount"
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
            value={cadence}
            onValueChange={(v) =>
              setCadence(v as (typeof RECURRING_CADENCES)[number])
            }
            options={CADENCE_OPTIONS}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="recurring-next">Next due</Label>
        <DatePicker
          id="recurring-next"
          value={nextDueDate}
          onChange={setNextDueDate}
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Saving…" : "Add"}
      </Button>
    </form>
  );
}
