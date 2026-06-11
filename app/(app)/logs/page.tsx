"use client";

import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EXPENSE_TYPES } from "@/convex/lib/constants";
import {
  formatDate,
  formatDuration,
  formatMoney,
  minutesToTime,
  parseMoneyToMinor,
  timeToMinutes,
  titleCase,
  todayISO,
} from "@/lib/format";

const EXPENSE_OPTIONS = EXPENSE_TYPES.map((t) => ({
  value: t,
  label: titleCase(t),
}));

export default function LogsPage() {
  const profile = useQuery(api.profiles.getMine);
  const currency = profile?.currency ?? "GBP";
  const odometerUnit = profile?.odometerUnit ?? "km";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Logs</h1>
        <p className="text-muted-foreground text-sm">
          Record income, expenses, mileage and shifts. Updates are live.
        </p>
      </div>

      <Tabs defaultValue="income" className="gap-4">
        <TabsList>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="mileage">Mileage</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
        </TabsList>
        <TabsContent value="income">
          <IncomePanel currency={currency} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensePanel currency={currency} />
        </TabsContent>
        <TabsContent value="mileage">
          <MileagePanel odometerUnit={odometerUnit} />
        </TabsContent>
        <TabsContent value="shifts">
          <ShiftsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// --- Income ---

function IncomePanel({ currency }: { currency: string }) {
  const rows = useQuery(api.income.list);
  const remove = useMutation(api.income.remove);
  return (
    <Panel
      title="Income"
      action={
        <AddDialog title="Add income">
          {(close) => <IncomeForm onDone={close} />}
        </AddDialog>
      }
    >
      <EntryTable
        empty="No income yet."
        head={["Date", "Platform", "Amount", ""]}
        rows={rows}
        render={(r) => (
          <TableRow key={r._id}>
            <TableCell>{formatDate(r.date)}</TableCell>
            <TableCell>{r.platform}</TableCell>
            <TableCell className="tabular-nums">
              {formatMoney(r.amountMinor, currency)}
            </TableCell>
            <TableCell className="text-right">
              <DeleteButton onClick={() => remove({ id: r._id })} />
            </TableCell>
          </TableRow>
        )}
      />
    </Panel>
  );
}

function IncomeForm({ onDone }: { onDone: () => void }) {
  const add = useMutation(api.income.add);
  const [platform, setPlatform] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());

  return (
    <EntryForm
      submitLabel="Add income"
      onSubmit={async () => {
        const amountMinor = parseMoneyToMinor(amount);
        if (!platform.trim() || amountMinor === null) {
          toast.error("Enter a platform and amount.");
          return false;
        }
        await add({ platform: platform.trim(), amountMinor, date });
        return true;
      }}
      onDone={onDone}
    >
      <Field label="Platform">
        <Input value={platform} onChange={(e) => setPlatform(e.target.value)} />
      </Field>
      <Field label="Amount">
        <Input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label="Date">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
    </EntryForm>
  );
}

// --- Expenses ---

function ExpensePanel({ currency }: { currency: string }) {
  const rows = useQuery(api.expenses.list);
  const remove = useMutation(api.expenses.remove);
  return (
    <Panel
      title="Expenses"
      action={
        <AddDialog title="Add expense">
          {(close) => <ExpenseForm onDone={close} />}
        </AddDialog>
      }
    >
      <EntryTable
        empty="No expenses yet."
        head={["Date", "Type", "Amount", ""]}
        rows={rows}
        render={(r) => (
          <TableRow key={r._id}>
            <TableCell>{formatDate(r.date)}</TableCell>
            <TableCell>{titleCase(r.expenseType)}</TableCell>
            <TableCell className="tabular-nums">
              {formatMoney(r.amountMinor, currency)}
            </TableCell>
            <TableCell className="text-right">
              <DeleteButton onClick={() => remove({ id: r._id })} />
            </TableCell>
          </TableRow>
        )}
      />
    </Panel>
  );
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const add = useMutation(api.expenses.add);
  const [expenseType, setExpenseType] = useState<
    (typeof EXPENSE_TYPES)[number]
  >(EXPENSE_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());

  return (
    <EntryForm
      submitLabel="Add expense"
      onSubmit={async () => {
        const amountMinor = parseMoneyToMinor(amount);
        if (amountMinor === null) {
          toast.error("Enter an amount.");
          return false;
        }
        await add({ expenseType, amountMinor, date });
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
          options={EXPENSE_OPTIONS}
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
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
    </EntryForm>
  );
}

// --- Mileage ---

function MileagePanel({ odometerUnit }: { odometerUnit: string }) {
  const rows = useQuery(api.odometers.list);
  const vehicles = useQuery(api.vehicles.list);
  const remove = useMutation(api.odometers.remove);
  const vehicleLabel = (id?: Id<"vehicles">) =>
    id ? (vehicles?.find((v) => v._id === id)?.label ?? "—") : "—";

  return (
    <Panel
      title="Mileage"
      action={
        <AddDialog title="Add mileage">
          {(close) => <MileageForm onDone={close} vehicles={vehicles} />}
        </AddDialog>
      }
    >
      <EntryTable
        empty="No mileage yet."
        head={["Date", "Vehicle", `Distance (${odometerUnit})`, ""]}
        rows={rows}
        render={(r) => (
          <TableRow key={r._id}>
            <TableCell>{formatDate(r.date)}</TableCell>
            <TableCell>{vehicleLabel(r.vehicleId)}</TableCell>
            <TableCell className="tabular-nums">
              {(r.endReading - r.startReading).toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              <DeleteButton onClick={() => remove({ id: r._id })} />
            </TableCell>
          </TableRow>
        )}
      />
    </Panel>
  );
}

function MileageForm({
  onDone,
  vehicles,
}: {
  onDone: () => void;
  vehicles: { _id: Id<"vehicles">; label: string }[] | undefined;
}) {
  const add = useMutation(api.odometers.add);
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [vehicleId, setVehicleId] = useState("none");

  return (
    <EntryForm
      submitLabel="Add mileage"
      onSubmit={async () => {
        const s = Number.parseFloat(start);
        const e = Number.parseFloat(end);
        if (!Number.isFinite(s) || !Number.isFinite(e)) {
          toast.error("Enter start and end readings.");
          return false;
        }
        await add({
          date,
          startReading: s,
          endReading: e,
          vehicleId:
            vehicleId !== "none" ? (vehicleId as Id<"vehicles">) : undefined,
        });
        return true;
      }}
      onDone={onDone}
    >
      <Field label="Date">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
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
    </EntryForm>
  );
}

// --- Shifts ---

function ShiftsPanel() {
  const rows = useQuery(api.shifts.list);
  const vehicles = useQuery(api.vehicles.list);
  const remove = useMutation(api.shifts.remove);
  return (
    <Panel
      title="Shifts"
      action={
        <AddDialog title="Add shift">
          {(close) => <ShiftForm onDone={close} vehicles={vehicles} />}
        </AddDialog>
      }
    >
      <EntryTable
        empty="No shifts yet."
        head={["Date", "Time", "Hours", "Platform", ""]}
        rows={rows}
        render={(r) => (
          <TableRow key={r._id}>
            <TableCell>{formatDate(r.date)}</TableCell>
            <TableCell className="tabular-nums">
              {minutesToTime(r.startMinutes)}–{minutesToTime(r.endMinutes)}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatDuration(r.durationMin)}
            </TableCell>
            <TableCell>{r.platform ?? "—"}</TableCell>
            <TableCell className="text-right">
              <DeleteButton onClick={() => remove({ id: r._id })} />
            </TableCell>
          </TableRow>
        )}
      />
    </Panel>
  );
}

function ShiftForm({
  onDone,
  vehicles,
}: {
  onDone: () => void;
  vehicles: { _id: Id<"vehicles">; label: string }[] | undefined;
}) {
  const add = useMutation(api.shifts.add);
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [platform, setPlatform] = useState("");
  const [vehicleId, setVehicleId] = useState("none");

  return (
    <EntryForm
      submitLabel="Add shift"
      onSubmit={async () => {
        const s = timeToMinutes(start);
        const e = timeToMinutes(end);
        if (s === null || e === null) {
          toast.error("Enter valid start and end times.");
          return false;
        }
        await add({
          date,
          startMinutes: s,
          endMinutes: e,
          platform: platform.trim() || undefined,
          vehicleId:
            vehicleId !== "none" ? (vehicleId as Id<"vehicles">) : undefined,
        });
        return true;
      }}
      onDone={onDone}
    >
      <Field label="Date">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
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
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        />
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
    </EntryForm>
  );
}

// --- Shared form/table primitives ---

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EntryForm({
  submitLabel,
  onSubmit,
  onDone,
  children,
}: {
  submitLabel: string;
  onSubmit: () => Promise<boolean>;
  onDone: () => void;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  async function handle(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (await onSubmit()) onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={handle} className="space-y-4">
      {children}
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EntryTable<T>({
  rows,
  head,
  render,
  empty,
}: {
  rows: T[] | undefined;
  head: string[];
  render: (row: T) => ReactNode;
  empty: string;
}) {
  if (rows === undefined) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{empty}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {head.map((h, i) => (
            <TableHead key={h || `col-${i}`}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{rows.map(render)}</TableBody>
    </Table>
  );
}

function DeleteButton({ onClick }: { onClick: () => Promise<unknown> }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Delete"
      onClick={() => {
        onClick().catch(() => toast.error("Failed to delete"));
      }}
    >
      <Trash2 className="size-4 text-muted-foreground" />
    </Button>
  );
}
