"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Printer } from "lucide-react";
import { useState } from "react";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { formatDuration, formatMoney, titleCase } from "@/lib/format";
import {
  estimateTax,
  mileageAllowanceMinor,
  type TaxJurisdiction,
} from "@/lib/tax";

const KM_PER_MILE = 1.60934;

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const profile = useQuery(api.profiles.getMine);
  const summary = useQuery(api.dashboard.summary, { year: Number(year) });

  const currency = profile?.currency ?? "GBP";
  const jurisdiction = (profile?.taxJurisdiction ?? "UK") as TaxJurisdiction;
  const odometerUnit = profile?.odometerUnit ?? "km";

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = String(currentYear - i);
    return { value: y, label: y };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm">
            Tax-year summary — print or save as PDF.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <SelectField
            className="w-28"
            value={year}
            onValueChange={setYear}
            options={yearOptions}
          />
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {summary === undefined ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <ReportBody
          year={Number(year)}
          currency={currency}
          jurisdiction={jurisdiction}
          odometerUnit={odometerUnit}
          summary={summary}
        />
      )}
    </div>
  );
}

type Summary = FunctionReturnType<typeof api.dashboard.summary>;

function ReportBody({
  year,
  currency,
  jurisdiction,
  odometerUnit,
  summary,
}: {
  year: number;
  currency: string;
  jurisdiction: TaxJurisdiction;
  odometerUnit: string;
  summary: Summary;
}) {
  const profit = Math.max(0, summary.yearNetMinor);
  const tax = estimateTax(jurisdiction, profit);
  const yearMiles =
    odometerUnit === "mi"
      ? summary.yearDistance
      : summary.yearDistance / KM_PER_MILE;
  const mileage = mileageAllowanceMinor(jurisdiction, yearMiles);
  const hours = summary.yearMinutes / 60;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-xl">Tax-year report · {year}</h2>
        <p className="text-muted-foreground text-sm">
          {jurisdiction} · estimate for the {year} calendar year. Not tax
          advice.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Total income"
          value={formatMoney(summary.yearIncomeMinor, currency)}
        />
        <Stat
          label="Total expenses"
          value={formatMoney(summary.yearExpenseMinor, currency)}
        />
        <Stat
          label="Net profit"
          value={formatMoney(summary.yearNetMinor, currency)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimated tax ({tax.taxYear})</CardTitle>
          <CardDescription>
            On {formatMoney(profit, currency)} taxable profit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <ReportRow
                label="Income tax"
                value={formatMoney(tax.incomeTaxMinor, currency)}
              />
              <ReportRow
                label={tax.secondaryLabel}
                value={formatMoney(tax.secondaryTaxMinor, currency)}
              />
              <ReportRow
                strong
                label="Total estimated tax"
                value={formatMoney(tax.totalTaxMinor, currency)}
              />
              <ReportRow
                label="Take-home after tax"
                value={formatMoney(tax.takeHomeMinor, currency)}
              />
              <ReportRow
                label="Effective tax rate"
                value={`${(tax.effectiveRate * 100).toFixed(1)}%`}
              />
              {mileage > 0 && (
                <ReportRow
                  label={`Mileage allowance (${Math.round(yearMiles).toLocaleString()} mi)`}
                  value={formatMoney(mileage, currency)}
                />
              )}
              {hours > 0 && (
                <ReportRow
                  label="Hours worked · effective rate"
                  value={`${formatDuration(summary.yearMinutes)} · ${formatMoney(
                    Math.round(summary.yearIncomeMinor / hours),
                    currency,
                  )}/h`}
                />
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownTable
          title="Income by platform"
          currency={currency}
          empty="No income."
          rows={summary.byPlatform.map((p) => ({
            label: p.platform,
            amountMinor: p.amountMinor,
          }))}
        />
        <BreakdownTable
          title="Expenses by category"
          currency={currency}
          empty="No expenses."
          rows={summary.byCategory.map((c) => ({
            label: titleCase(c.expenseType),
            amountMinor: c.amountMinor,
          }))}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ReportRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr className="border-b last:border-0">
      <td
        className={`py-1.5 ${strong ? "font-medium" : "text-muted-foreground"}`}
      >
        {label}
      </td>
      <td
        className={`py-1.5 text-right tabular-nums ${strong ? "font-semibold" : ""}`}
      >
        {value}
      </td>
    </tr>
  );
}

function BreakdownTable({
  title,
  rows,
  currency,
  empty,
}: {
  title: string;
  rows: { label: string; amountMinor: number }[];
  currency: string;
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell>{r.label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(r.amountMinor, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
