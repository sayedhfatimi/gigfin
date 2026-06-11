"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const config = {
  income: { label: "Income", color: "var(--chart-1)" },
  expense: { label: "Expenses", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function MonthlyChart({
  data,
}: {
  data: { month: number; incomeMinor: number; expenseMinor: number }[];
}) {
  const chartData = data.map((d) => ({
    month: MONTHS[d.month - 1],
    income: d.incomeMinor / 100,
    expense: d.expenseMinor / 100,
  }));

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
