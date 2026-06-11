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
import { api } from "@/convex/_generated/api";
import { formatMoney, parseMoneyToMinor, todayISO } from "@/lib/format";

const TYPE_OPTIONS = [
  { value: "income", label: "Income" },
  { value: "savings", label: "Savings (net)" },
];
const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
const periodWord = (p: string) =>
  p === "weekly" ? "this week" : p === "monthly" ? "this month" : "this period";

export function GoalsCard({ currency }: { currency: string }) {
  const rows = useQuery(api.goals.withProgress, { today: todayISO() });
  const remove = useMutation(api.goals.remove);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Goals</CardTitle>
            <CardDescription>Income &amp; savings targets.</CardDescription>
          </div>
          <AddDialog title="Add goal">
            {(close) => <GoalForm onDone={close} />}
          </AddDialog>
        </div>
      </CardHeader>
      <CardContent>
        {rows === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No goals yet.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((g) => {
              const pct =
                g.targetMinor > 0
                  ? Math.min(100, (g.progressMinor / g.targetMinor) * 100)
                  : 0;
              return (
                <li key={g._id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="capitalize">
                      {g.type} goal · {periodWord(g.period)}
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground tabular-nums">
                      {formatMoney(Math.max(0, g.progressMinor), currency)} /{" "}
                      {formatMoney(g.targetMinor, currency)}
                      <button
                        type="button"
                        aria-label="Delete goal"
                        onClick={() =>
                          remove({ id: g._id }).catch(() =>
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
                      className="h-full rounded-full bg-primary"
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

function GoalForm({ onDone }: { onDone: () => void }) {
  const add = useMutation(api.goals.add);
  const [type, setType] = useState<"income" | "savings">("income");
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const targetMinor = parseMoneyToMinor(target);
    if (targetMinor === null || targetMinor <= 0) {
      toast.error("Enter a target amount.");
      return;
    }
    setBusy(true);
    try {
      await add({ type, period, targetMinor, startDate: todayISO() });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="goal-type">Type</Label>
          <SelectField
            id="goal-type"
            value={type}
            onValueChange={(v) => setType(v as "income" | "savings")}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="goal-period">Period</Label>
          <SelectField
            id="goal-period"
            value={period}
            onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}
            options={PERIOD_OPTIONS}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="goal-target">Target amount</Label>
        <Input
          id="goal-target"
          inputMode="decimal"
          placeholder="0.00"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add goal"}
        </Button>
      </DialogFooter>
    </form>
  );
}
