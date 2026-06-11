"use client";

import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { EXPENSE_TYPES } from "@/convex/lib/constants";
import {
  formatMoney,
  parseMoneyToMinor,
  titleCase,
  todayISO,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const SCOPE_OPTIONS = [
  { value: "overall", label: "Overall" },
  ...EXPENSE_TYPES.map((t) => ({ value: t, label: titleCase(t) })),
];
const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function BudgetsCard({ currency }: { currency: string }) {
  const rows = useQuery(api.budgets.withProgress, { today: todayISO() });
  const remove = useMutation(api.budgets.remove);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Spending limits per period.</CardDescription>
          </div>
          <AddDialog title="Add budget">
            {(close) => <BudgetForm onDone={close} />}
          </AddDialog>
        </div>
      </CardHeader>
      <CardContent>
        {rows === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No budgets yet.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((b) => {
              const over = b.spentMinor > b.limitMinor;
              const pct =
                b.limitMinor > 0
                  ? Math.min(100, (b.spentMinor / b.limitMinor) * 100)
                  : 0;
              return (
                <li key={b._id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {b.expenseType ? titleCase(b.expenseType) : "Overall"} ·{" "}
                      {b.period}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-2 tabular-nums",
                        over ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {formatMoney(b.spentMinor, currency)} /{" "}
                      {formatMoney(b.limitMinor, currency)}
                      <button
                        type="button"
                        aria-label="Delete budget"
                        onClick={() =>
                          remove({ id: b._id }).catch(() =>
                            toast.error("Failed to delete"),
                          )
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        over ? "bg-destructive" : "bg-primary",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetForm({ onDone }: { onDone: () => void }) {
  const add = useMutation(api.budgets.add);
  const [scope, setScope] = useState("overall");
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const limitMinor = parseMoneyToMinor(limit);
    if (limitMinor === null || limitMinor <= 0) {
      toast.error("Enter a limit amount.");
      return;
    }
    setBusy(true);
    try {
      await add({
        expenseType:
          scope === "overall"
            ? undefined
            : (scope as (typeof EXPENSE_TYPES)[number]),
        period,
        limitMinor,
      });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="budget-scope">Scope</Label>
        <SelectField
          id="budget-scope"
          value={scope}
          onValueChange={setScope}
          options={SCOPE_OPTIONS}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="budget-period">Period</Label>
          <SelectField
            id="budget-period"
            value={period}
            onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}
            options={PERIOD_OPTIONS}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budget-limit">Limit</Label>
          <Input
            id="budget-limit"
            inputMode="decimal"
            placeholder="0.00"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add budget"}
        </Button>
      </DialogFooter>
    </form>
  );
}
