"use client";

import { formatMoney } from "@/lib/format";

export type BreakdownItem = { label: string; amountMinor: number };

// Proportion bars for a category/platform breakdown (dependency-free).
export function BreakdownList({
  items,
  currency,
  empty,
}: {
  items: BreakdownItem[];
  currency: string;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{empty}</p>;
  }
  const max = Math.max(...items.map((i) => i.amountMinor), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {formatMoney(item.amountMinor, currency)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.amountMinor / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
