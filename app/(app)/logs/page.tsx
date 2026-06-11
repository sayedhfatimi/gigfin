"use client";

import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <IncomeSection currency={currency} />
      <ExpenseSection currency={currency} />
      <MileageSection odometerUnit={odometerUnit} />
      <ShiftsSection />
    </div>
  );
}

function IncomeSection({ currency }: { currency: string }) {
  const rows = useQuery(api.income.list);
  const add = useMutation(api.income.add);
  const remove = useMutation(api.income.remove);
  const [platform, setPlatform] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amountMinor = parseMoneyToMinor(amount);
    if (!platform.trim() || amountMinor === null) {
      toast.error("Enter a platform and amount.");
      return;
    }
    try {
      await add({ platform: platform.trim(), amountMinor, date });
      setPlatform("");
      setAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
          <Input
            className="w-40"
            placeholder="Platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
          <Input
            className="w-32"
            inputMode="decimal"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            className="w-40"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button type="submit">Add</Button>
        </form>

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
      </CardContent>
    </Card>
  );
}

function ExpenseSection({ currency }: { currency: string }) {
  const rows = useQuery(api.expenses.list);
  const add = useMutation(api.expenses.add);
  const remove = useMutation(api.expenses.remove);
  const [expenseType, setExpenseType] = useState<
    (typeof EXPENSE_TYPES)[number]
  >(EXPENSE_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amountMinor = parseMoneyToMinor(amount);
    if (amountMinor === null) {
      toast.error("Enter an amount.");
      return;
    }
    try {
      await add({ expenseType, amountMinor, date });
      setAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
          <SelectField
            className="w-48"
            value={expenseType}
            onValueChange={(v) =>
              setExpenseType(v as (typeof EXPENSE_TYPES)[number])
            }
            options={EXPENSE_OPTIONS}
          />
          <Input
            className="w-32"
            inputMode="decimal"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            className="w-40"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button type="submit">Add</Button>
        </form>

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
      </CardContent>
    </Card>
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
  render: (row: T) => React.ReactNode;
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

function MileageSection({ odometerUnit }: { odometerUnit: string }) {
  const rows = useQuery(api.odometers.list);
  const vehicles = useQuery(api.vehicles.list);
  const add = useMutation(api.odometers.add);
  const remove = useMutation(api.odometers.remove);
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [vehicleId, setVehicleId] = useState("none");

  const vehicleLabel = (id?: Id<"vehicles">) =>
    id ? (vehicles?.find((v) => v._id === id)?.label ?? "—") : "—";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const s = Number.parseFloat(start);
    const en = Number.parseFloat(end);
    if (!Number.isFinite(s) || !Number.isFinite(en)) {
      toast.error("Enter start and end readings.");
      return;
    }
    try {
      await add({
        date,
        startReading: s,
        endReading: en,
        vehicleId:
          vehicleId !== "none" ? (vehicleId as Id<"vehicles">) : undefined,
      });
      setStart("");
      setEnd("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mileage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
          <Input
            className="w-40"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            className="w-28"
            inputMode="decimal"
            placeholder="Start"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Input
            className="w-28"
            inputMode="decimal"
            placeholder="End"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
          <SelectField
            className="w-44"
            value={vehicleId}
            onValueChange={setVehicleId}
            options={[
              { value: "none", label: "No vehicle" },
              ...(vehicles ?? []).map((v) => ({
                value: v._id,
                label: v.label,
              })),
            ]}
          />
          <Button type="submit">Add</Button>
        </form>

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
      </CardContent>
    </Card>
  );
}

function ShiftsSection() {
  const rows = useQuery(api.shifts.list);
  const vehicles = useQuery(api.vehicles.list);
  const add = useMutation(api.shifts.add);
  const remove = useMutation(api.shifts.remove);
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [platform, setPlatform] = useState("");
  const [vehicleId, setVehicleId] = useState("none");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const s = timeToMinutes(start);
    const en = timeToMinutes(end);
    if (s === null || en === null) {
      toast.error("Enter valid start and end times.");
      return;
    }
    try {
      await add({
        date,
        startMinutes: s,
        endMinutes: en,
        platform: platform.trim() || undefined,
        vehicleId:
          vehicleId !== "none" ? (vehicleId as Id<"vehicles">) : undefined,
      });
      setPlatform("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shifts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
          <Input
            className="w-40"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            className="w-28"
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Input
            className="w-28"
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
          <Input
            className="w-36"
            placeholder="Platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
          <SelectField
            className="w-44"
            value={vehicleId}
            onValueChange={setVehicleId}
            options={[
              { value: "none", label: "No vehicle" },
              ...(vehicles ?? []).map((v) => ({
                value: v._id,
                label: v.label,
              })),
            ]}
          />
          <Button type="submit">Add</Button>
        </form>

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
      </CardContent>
    </Card>
  );
}
