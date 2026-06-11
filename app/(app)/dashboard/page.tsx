"use client";

import { useQuery } from "convex/react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { formatMoney } from "@/lib/format";

export default function DashboardPage() {
  const profile = useQuery(api.profiles.getMine);
  const income = useQuery(api.income.list);
  const expenses = useQuery(api.expenses.list);

  const currency = profile?.currency ?? "GBP";
  const totalIncome = (income ?? []).reduce((s, r) => s + r.amountMinor, 0);
  const totalExpense = (expenses ?? []).reduce((s, r) => s + r.amountMinor, 0);

  const stats = [
    { label: "Total income", value: totalIncome },
    { label: "Total expenses", value: totalExpense },
    { label: "Net", value: totalIncome - totalExpense },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your earnings at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="gap-1">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatMoney(s.value, currency)}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        Customizable widgets &amp; charts arrive in the next phase.
      </p>
    </div>
  );
}
