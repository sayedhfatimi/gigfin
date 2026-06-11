"use client";

import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { monthlyExpenseMinor } from "@/lib/expenses-agg";
import { monthlyIncomeMinor } from "@/lib/income";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Monthly income vs expenses for the current calendar year. Fixed (annual).
export function IncomeVsExpensesWidget({ data }: WidgetProps) {
  const year = new Date().getFullYear();
  const income = monthlyIncomeMinor(data.income, year);
  const expense = monthlyExpenseMinor(data.expenses, year);
  const chartData = income.map((incomeMinor, i) => ({
    month: i + 1,
    incomeMinor,
    expenseMinor: expense[i],
  }));

  return (
    <WidgetCard title="Income vs expenses" caption={`Monthly · ${year}`}>
      <MonthlyChart data={chartData} />
    </WidgetCard>
  );
}
