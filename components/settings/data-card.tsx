"use client";

import { useMutation, useQuery } from "convex/react";
import { Download, Sparkles, Upload } from "lucide-react";
import { type ChangeEvent, useRef } from "react";
import { toast } from "sonner";
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
  const loadSample = useMutation(api.seed.loadSample);
  const incomeInput = useRef<HTMLInputElement>(null);
  const expenseInput = useRef<HTMLInputElement>(null);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data</CardTitle>
        <CardDescription>
          Export your ledger or import income / expenses from CSV.
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
          onClick={() =>
            loadSample({})
              .then(() => toast.success("Sample data loaded"))
              .catch(() => toast.error("Failed to load sample data"))
          }
        >
          <Sparkles className="size-4" />
          Load sample data
        </Button>
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
      </CardContent>
    </Card>
  );
}
