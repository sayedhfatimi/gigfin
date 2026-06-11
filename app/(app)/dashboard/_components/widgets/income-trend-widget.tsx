"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { timeframeLabel } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

const config = {
  income: { label: "Income", color: "var(--chart-1)" },
} satisfies ChartConfig;

// Daily income over the active timeframe. Global.
export function IncomeTrendWidget({ data }: WidgetProps) {
  const byDate = new Map<string, number>();
  for (const r of data.scoped.income) {
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.amountMinor);
  }
  const chartData = [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, minor]) => ({ label: formatDate(date), income: minor / 100 }));

  return (
    <WidgetCard title="Income trend" caption={timeframeLabel(data.timeframe)}>
      {chartData.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No income in this period.
        </p>
      ) : (
        <ChartContainer config={config} className="aspect-auto h-48 w-full">
          <LineChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="income"
              stroke="var(--color-income)"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      )}
    </WidgetCard>
  );
}
