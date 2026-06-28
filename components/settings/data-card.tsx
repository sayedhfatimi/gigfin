"use client";

import { useMutation, useQuery } from "convex/react";
import { Download, Upload } from "lucide-react";
import { type ChangeEvent, useRef } from "react";
import { toast } from "sonner";
import { MigrateDialog } from "@/components/settings/migrate-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { EXPENSE_TYPES } from "@/convex/lib/constants";
import { downloadText, parseCSV, toCSV } from "@/lib/csv";
import { parseMoneyToMinor } from "@/lib/format";

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const major = (minor: number) => (minor / 100).toFixed(2);
const EXPENSE_SET = new Set<string>(EXPENSE_TYPES);

export function DataCard() {
  const data = useQuery(api.data.exportAll);
  const importIncome = useMutation(api.data.importIncome);
  const importExpenses = useMutation(api.data.importExpenses);
  const importOdometers = useMutation(api.data.importOdometers);
  const importShifts = useMutation(api.data.importShifts);
  const incomeInput = useRef<HTMLInputElement>(null);
  const expenseInput = useRef<HTMLInputElement>(null);
  const mileageInput = useRef<HTMLInputElement>(null);
  const shiftInput = useRef<HTMLInputElement>(null);

  function exportIncome() {
    if (!data) return;
    const csv = toCSV(
      ["date", "platform", "amount"],
      data.income.map((i) => [i.date, i.platform, major(i.amountMinor)]),
    );
    downloadText("gigfin-income.csv", csv);
  }

  function exportExpenses() {
    if (!data) return;
    const csv = toCSV(
      ["date", "type", "amount", "notes"],
      data.expenses.map((e) => [
        e.date,
        e.expenseType,
        major(e.amountMinor),
        e.notes ?? "",
      ]),
    );
    downloadText("gigfin-expenses.csv", csv);
  }

  function exportMileage() {
    if (!data) return;
    const csv = toCSV(
      ["date", "start", "end", "notes"],
      data.odometers.map((o) => [
        o.date,
        o.startReading,
        o.endReading ?? "",
        o.notes ?? "",
      ]),
    );
    downloadText("gigfin-mileage.csv", csv);
  }

  function exportShifts() {
    if (!data) return;
    const csv = toCSV(
      ["date", "start_min", "end_min", "platform", "notes"],
      data.shifts.map((s) => [
        s.date,
        s.startMinutes,
        s.endMinutes ?? "",
        s.platform ?? "",
        s.notes ?? "",
      ]),
    );
    downloadText("gigfin-shifts.csv", csv);
  }

  async function onImportIncome(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (incomeInput.current) incomeInput.current.value = "";
    if (!file) return;
    const rows = parseCSV(await file.text())
      .filter((r) => isDate(r[0]?.trim()))
      .map((r) => ({
        date: r[0].trim(),
        platform: (r[1] ?? "").trim(),
        amountMinor: parseMoneyToMinor(r[2] ?? ""),
      }))
      .filter((r) => r.platform && r.amountMinor !== null) as {
      date: string;
      platform: string;
      amountMinor: number;
    }[];
    if (rows.length === 0) {
      toast.error(
        "No valid income rows found (expected date,platform,amount).",
      );
      return;
    }
    try {
      const n = await importIncome({ rows });
      toast.success(`Imported ${n} income rows`);
    } catch {
      toast.error("Import failed");
    }
  }

  async function onImportExpenses(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (expenseInput.current) expenseInput.current.value = "";
    if (!file) return;
    const rows = parseCSV(await file.text())
      .filter(
        (r) => isDate(r[0]?.trim()) && EXPENSE_SET.has((r[1] ?? "").trim()),
      )
      .map((r) => ({
        date: r[0].trim(),
        expenseType: r[1].trim() as (typeof EXPENSE_TYPES)[number],
        amountMinor: parseMoneyToMinor(r[2] ?? ""),
        notes: (r[3] ?? "").trim() || undefined,
      }))
      .filter((r) => r.amountMinor !== null) as {
      date: string;
      expenseType: (typeof EXPENSE_TYPES)[number];
      amountMinor: number;
      notes?: string;
    }[];
    if (rows.length === 0) {
      toast.error(
        "No valid expense rows (expected date,type,amount with a known type).",
      );
      return;
    }
    try {
      const n = await importExpenses({ rows });
      toast.success(`Imported ${n} expense rows`);
    } catch {
      toast.error("Import failed");
    }
  }

  async function onImportMileage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (mileageInput.current) mileageInput.current.value = "";
    if (!file) return;
    const num = (s: string) => {
      const n = Number.parseFloat(s.trim());
      return Number.isFinite(n) ? n : null;
    };
    const rows = parseCSV(await file.text())
      .filter((r) => isDate(r[0]?.trim()) && num(r[1] ?? "") !== null)
      .map((r) => ({
        date: r[0].trim(),
        startReading: num(r[1]) as number,
        endReading: num(r[2] ?? "") ?? undefined,
        notes: (r[3] ?? "").trim() || undefined,
      }));
    if (rows.length === 0) {
      toast.error("No valid mileage rows (expected date,start,end,notes).");
      return;
    }
    try {
      const n = await importOdometers({ rows });
      toast.success(`Imported ${n} mileage rows`);
    } catch {
      toast.error("Import failed");
    }
  }

  async function onImportShifts(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (shiftInput.current) shiftInput.current.value = "";
    if (!file) return;
    const int = (s: string) => {
      const n = Number.parseInt(s.trim(), 10);
      return Number.isFinite(n) ? n : null;
    };
    const rows = parseCSV(await file.text())
      .filter((r) => isDate(r[0]?.trim()) && int(r[1] ?? "") !== null)
      .map((r) => ({
        date: r[0].trim(),
        startMinutes: int(r[1]) as number,
        endMinutes: int(r[2] ?? "") ?? undefined,
        platform: (r[3] ?? "").trim() || undefined,
        notes: (r[4] ?? "").trim() || undefined,
      }));
    if (rows.length === 0) {
      toast.error(
        "No valid shift rows (expected date,start_min,end_min,platform,notes).",
      );
      return;
    }
    try {
      const n = await importShifts({ rows });
      toast.success(`Imported ${n} shift rows`);
    } catch {
      toast.error("Import failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data</CardTitle>
        <CardDescription>
          Export your ledger or import income, expenses, mileage and shifts from
          CSV.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!data}
          onClick={exportIncome}
        >
          <Download className="size-4" />
          Export income
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!data}
          onClick={exportExpenses}
        >
          <Download className="size-4" />
          Export expenses
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => incomeInput.current?.click()}
        >
          <Upload className="size-4" />
          Import income
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => expenseInput.current?.click()}
        >
          <Upload className="size-4" />
          Import expenses
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!data}
          onClick={exportMileage}
        >
          <Download className="size-4" />
          Export mileage
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mileageInput.current?.click()}
        >
          <Upload className="size-4" />
          Import mileage
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!data}
          onClick={exportShifts}
        >
          <Download className="size-4" />
          Export shifts
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => shiftInput.current?.click()}
        >
          <Upload className="size-4" />
          Import shifts
        </Button>
        <MigrateDialog />
        <input
          ref={incomeInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={onImportIncome}
        />
        <input
          ref={expenseInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={onImportExpenses}
        />
        <input
          ref={mileageInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={onImportMileage}
        />
        <input
          ref={shiftInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={onImportShifts}
        />
      </CardContent>
    </Card>
  );
}
