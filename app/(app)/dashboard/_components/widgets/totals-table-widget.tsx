"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { timeframeLabel } from "@/lib/dates";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { WidgetCard } from "../widget-card";
import type { WidgetProps } from "../widget-types";

// Most recent income + expense entries for the timeframe. Global.
export function TotalsTableWidget({ data }: WidgetProps) {
  const items = [
    ...data.scoped.income.map((r) => ({
      id: r._id,
      date: r.date,
      label: r.platform,
      amountMinor: r.amountMinor,
      kind: "in" as const,
    })),
    ...data.scoped.expenses.map((r) => ({
      id: r._id,
      date: r.date,
      label: titleCase(r.expenseType),
      amountMinor: r.amountMinor,
      kind: "out" as const,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  return (
    <WidgetCard title="Recent entries" caption={timeframeLabel(data.timeframe)}>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing in this period.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{formatDate(r.date)}</TableCell>
                <TableCell>{r.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.kind === "out" ? "−" : ""}
                  {formatMoney(r.amountMinor, data.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </WidgetCard>
  );
}
