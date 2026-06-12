"use client";

import { Line, LineChart } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const config = { v: { color: "var(--chart-1)" } } satisfies ChartConfig;

// A bare mini line — no axes, grid, or tooltip. `data` is plain numbers; `null`
// entries render as gaps. Returns nothing when there's too little to plot.
export function Sparkline({
  data,
  className,
}: {
  data: (number | null)[];
  className?: string;
}) {
  if (data.filter((d) => d !== null).length < 2) return null;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ChartContainer
      config={config}
      className={className ?? "aspect-auto h-10 w-full"}
    >
      <LineChart
        data={points}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
      >
        <Line
          dataKey="v"
          stroke="var(--color-v)"
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
          connectNulls={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
