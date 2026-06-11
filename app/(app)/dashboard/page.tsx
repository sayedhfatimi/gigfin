"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { BudgetsCard } from "@/components/dashboard/budgets-card";
import { GoalsCard } from "@/components/dashboard/goals-card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { TaxCard } from "@/components/dashboard/tax-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { formatMoney, titleCase } from "@/lib/format";
import type { TaxJurisdiction } from "@/lib/tax";

const KM_PER_MILE = 1.60934;

export default function DashboardPage() {
  const [year] = useState(() => new Date().getFullYear());
  const profile = useQuery(api.profiles.getMine);
  const summary = useQuery(api.dashboard.summary, { year });

  const currency = profile?.currency ?? "GBP";
  const jurisdiction = (profile?.taxJurisdiction ?? "UK") as TaxJurisdiction;
  const odometerUnit = profile?.odometerUnit ?? "km";

  if (summary === undefined) {
    return (
      <div className="space-y-6">
        <Header year={year} />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  const yearHours = summary.yearMinutes / 60;
  const ratePerHourMinor =
    yearHours > 0 ? Math.round(summary.yearIncomeMinor / yearHours) : null;

  const stats = [
    {
      label: `${year} income`,
      value: formatMoney(summary.yearIncomeMinor, currency),
    },
    {
      label: `${year} expenses`,
      value: formatMoney(summary.yearExpenseMinor, currency),
    },
    {
      label: `${year} net`,
      value: formatMoney(summary.yearNetMinor, currency),
    },
    {
      label: "Per hour",
      value:
        ratePerHourMinor === null
          ? "—"
          : `${formatMoney(ratePerHourMinor, currency)}/h`,
    },
  ];

  const yearMiles =
    odometerUnit === "mi"
      ? summary.yearDistance
      : summary.yearDistance / KM_PER_MILE;

  return (
    <div className="space-y-6">
      <Header year={year} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="gap-1">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income vs expenses</CardTitle>
            <CardDescription>Monthly, {year}</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={summary.byMonth} />
          </CardContent>
        </Card>

        <TaxCard
          jurisdiction={jurisdiction}
          currency={currency}
          yearNetMinor={summary.yearNetMinor}
          yearMiles={yearMiles}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income by platform</CardTitle>
            <CardDescription>{year}</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownList
              currency={currency}
              empty="No income this year."
              items={summary.byPlatform.map((p) => ({
                label: p.platform,
                amountMinor: p.amountMinor,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
            <CardDescription>{year}</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownList
              currency={currency}
              empty="No expenses this year."
              items={summary.byCategory.map((c) => ({
                label: titleCase(c.expenseType),
                amountMinor: c.amountMinor,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GoalsCard currency={currency} />
        <BudgetsCard currency={currency} />
      </div>
    </div>
  );
}

function Header({ year }: { year: number }) {
  return (
    <div>
      <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground text-sm">
        Your {year} earnings at a glance.
      </p>
    </div>
  );
}
