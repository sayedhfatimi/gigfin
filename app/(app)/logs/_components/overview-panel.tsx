"use client";

import { useQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildOverviewDays, groupByDay, type OverviewDay } from "@/lib/daily";
import { formatDate, formatDuration, formatMoney } from "@/lib/format";
import { formatDistance } from "@/lib/odometer";
import { cn } from "@/lib/utils";
import {
  ExpenseEntryRow,
  IncomeEntryRow,
  MileageEntryRow,
  ShiftEntryRow,
} from "./entry-rows";
import { LogEmptyState, LogSkeleton } from "./log-empty-state";
import { useLogFilters, withinRange } from "./use-log-filters";

const PAGE_SIZE = 10;

// At-a-glance completeness across every entry type. One row per day with that
// day's totals and four dots showing whether income / expenses / mileage /
// shifts were logged — so a glance answers "did I forget something?". Expand a
// day to see (and edit/delete) its entries grouped by type.
export function OverviewPanel({
  currency,
  odometerUnit,
}: {
  currency: string;
  odometerUnit: string;
}) {
  const income = useQuery(api.income.list);
  const expenses = useQuery(api.expenses.list);
  const odometers = useQuery(api.odometers.list);
  const shifts = useQuery(api.shifts.list);
  const { from, setFrom, to, setTo } = useLogFilters();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);

  const loading =
    income === undefined ||
    expenses === undefined ||
    odometers === undefined ||
    shifts === undefined;

  const fIncome = useMemo(
    () => (income ?? []).filter((r) => withinRange(r.date, from, to)),
    [income, from, to],
  );
  const fExpenses = useMemo(
    () => (expenses ?? []).filter((r) => withinRange(r.date, from, to)),
    [expenses, from, to],
  );
  const fOdometers = useMemo(
    () => (odometers ?? []).filter((r) => withinRange(r.date, from, to)),
    [odometers, from, to],
  );
  const fShifts = useMemo(
    () => (shifts ?? []).filter((r) => withinRange(r.date, from, to)),
    [shifts, from, to],
  );

  const days = useMemo(
    () => buildOverviewDays(fIncome, fExpenses, fOdometers, fShifts),
    [fIncome, fExpenses, fOdometers, fShifts],
  );
  const incomeBy = useMemo(
    () => new Map(groupByDay(fIncome).map((g) => [g.date, g.entries])),
    [fIncome],
  );
  const expenseBy = useMemo(
    () => new Map(groupByDay(fExpenses).map((g) => [g.date, g.entries])),
    [fExpenses],
  );
  const odometerBy = useMemo(
    () => new Map(groupByDay(fOdometers).map((g) => [g.date, g.entries])),
    [fOdometers],
  );
  const shiftBy = useMemo(
    () => new Map(groupByDay(fShifts).map((g) => [g.date, g.entries])),
    [fShifts],
  );

  const pageCount = Math.max(1, Math.ceil(days.length / PAGE_SIZE));
  const page = Math.min(pageIndex, pageCount - 1);
  const visible = days.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const isMobile = useIsMobile();

  const toggle = (date: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const expandedBody = (date: string) => (
    <div className="space-y-3 p-2">
      <DaySection label="Income">
        {(incomeBy.get(date) ?? []).map((r) => (
          <IncomeEntryRow key={r._id} row={r} currency={currency} />
        ))}
      </DaySection>
      <DaySection label="Expenses">
        {(expenseBy.get(date) ?? []).map((r) => (
          <ExpenseEntryRow key={r._id} row={r} currency={currency} />
        ))}
      </DaySection>
      <DaySection label="Mileage">
        {(odometerBy.get(date) ?? []).map((r) => (
          <MileageEntryRow key={r._id} row={r} unit={odometerUnit} />
        ))}
      </DaySection>
      <DaySection label="Shifts">
        {(shiftBy.get(date) ?? []).map((r) => (
          <ShiftEntryRow key={r._id} row={r} />
        ))}
      </DaySection>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />
      </div>

      {loading ? (
        <LogSkeleton />
      ) : days.length === 0 ? (
        <LogEmptyState message="No activity in this range." />
      ) : isMobile ? (
        <div className="space-y-2">
          {visible.map((d) => {
            const open = expanded.has(d.date);
            return (
              <div key={d.date} className="overflow-hidden rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  onClick={() => toggle(d.date)}
                >
                  <span className="flex items-center gap-2">
                    {open ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{formatDate(d.date)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {net(d, currency)}
                    </span>
                    <CompletenessDots has={d.has} />
                  </span>
                </button>
                {open ? (
                  <div className="border-t">{expandedBody(d.date)}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Distance</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Logged</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((d) => {
              const open = expanded.has(d.date);
              return (
                <Fragment key={d.date}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggle(d.date)}
                  >
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {open ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">
                          {formatDate(d.date)}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.has.income
                        ? formatMoney(d.incomeMinor, currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.has.expenses
                        ? formatMoney(d.expenseMinor, currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.has.mileage
                        ? formatDistance(
                            d.distance,
                            odometerUnit as "km" | "mi",
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.has.shifts ? formatDuration(d.minutes) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex justify-end">
                        <CompletenessDots has={d.has} />
                      </span>
                    </TableCell>
                  </TableRow>
                  {open ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="p-0">
                        {expandedBody(d.date)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs tabular-nums">
            Page {page + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Net (income − expenses) for the compact mobile summary line.
function net(d: OverviewDay, currency: string) {
  return formatMoney(d.incomeMinor - d.expenseMinor, currency);
}

function CompletenessDots({ has }: { has: OverviewDay["has"] }) {
  const items: [string, boolean][] = [
    ["Income", has.income],
    ["Expenses", has.expenses],
    ["Mileage", has.mileage],
    ["Shifts", has.shifts],
  ];
  return (
    <span className="inline-flex items-center gap-1">
      {items.map(([label, on]) => (
        <span
          key={label}
          role="img"
          title={`${label}: ${on ? "logged" : "nothing"}`}
          aria-label={`${label}: ${on ? "logged" : "nothing"}`}
          className={cn(
            "size-2 rounded-full",
            on ? "bg-primary" : "border border-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

// A labelled group of entries inside an expanded day. Renders nothing when the
// day has no entries of this type.
function DaySection({
  label,
  children,
}: {
  label: string;
  children: ReactNode[];
}) {
  if (children.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      {children}
    </div>
  );
}
