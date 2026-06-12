"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { incomePerMileSeries } from "@/lib/daily";
import { timeframeLabel } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

const config = {
  perMile: { label: "Per mile", color: "var(--chart-1)" },
} satisfies ChartConfig;

// Income earned per business mile, per day, over the active timeframe. Days with
// no miles render as gaps rather than misleading points. Global.
export function IncomePerMileTrendWidget({ data }: WidgetProps) {
  const series = incomePerMileSeries(
    data.scoped.income,
    data.scoped.odometers,
    data.odometerUnit,
  );
  const chartData = series.map((d) => ({
    label: formatDate(d.date),
    perMile: d.perMileMinor === null ? null : d.perMileMinor / 100,
  }));
  const hasData = chartData.some((d) => d.perMile !== null);

  return (
    <WidgetCard
      title="Income per mile trend"
      caption={timeframeLabel(data.timeframe)}
    >
      {hasData ? (
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
              dataKey="perMile"
              stroke="var(--color-perMile)"
              dot={false}
              strokeWidth={2}
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <p className="text-muted-foreground text-sm">
          No mileage in this period.
        </p>
      )}
    </WidgetCard>
  );
}
