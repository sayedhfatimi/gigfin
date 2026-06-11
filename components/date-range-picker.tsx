"use client";

import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function isoToDate(iso: string): Date | undefined {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Inclusive date-range picker backed by the shadcn calendar (two months, range
// mode). from/to are ISO YYYY-MM-DD; either can be empty.
export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasValue = Boolean(from || to);
  const range: DateRange | undefined = hasValue
    ? { from: isoToDate(from), to: isoToDate(to) }
    : undefined;
  const label =
    from && to
      ? `${formatDate(from)} – ${formatDate(to)}`
      : from
        ? `From ${formatDate(from)}`
        : to
          ? `Until ${formatDate(to)}`
          : "Date range";

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "justify-start font-normal",
                !hasValue && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="size-4" />
              {label}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={(r) =>
              onChange(
                r?.from ? dateToIso(r.from) : "",
                r?.to ? dateToIso(r.to) : "",
              )
            }
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {hasValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear date range"
          onClick={() => onChange("", "")}
        >
          <X className="size-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
