"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format";

export type DayGroup<T> = { date: string; entries: T[] };

// Day-grouped, expandable list shared by all four log tabs and the Overview.
// One collapsed row per day (date + count + a right-aligned summary); clicking
// reveals that day's individual entries. Paginates by DAY-group, not by entry,
// so page boundaries never fall mid-day.
export function DayGroupTable<T extends { _id: string; date: string }>({
  groups,
  renderSummary,
  renderEntry,
  pageSize = 10,
}: {
  groups: DayGroup<T>[];
  renderSummary: (g: DayGroup<T>) => ReactNode;
  renderEntry: (entry: T) => ReactNode;
  pageSize?: number;
}) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.max(1, Math.ceil(groups.length / pageSize));
  const page = Math.min(pageIndex, pageCount - 1);
  const visible = useMemo(
    () => groups.slice(page * pageSize, page * pageSize + pageSize),
    [groups, page, pageSize],
  );

  const toggle = (date: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const count = (g: DayGroup<T>) =>
    `${g.entries.length} ${g.entries.length === 1 ? "entry" : "entries"}`;

  const entryList = (g: DayGroup<T>) => (
    <div className="space-y-2 p-2">
      {g.entries.map((e) => (
        <div key={e._id}>{renderEntry(e)}</div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {isMobile ? (
        <div className="space-y-2">
          {visible.map((g) => {
            const open = expanded.has(g.date);
            return (
              <div key={g.date} className="overflow-hidden rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  onClick={() => toggle(g.date)}
                >
                  <span className="flex items-center gap-2">
                    {open ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{formatDate(g.date)}</span>
                    <span className="text-muted-foreground text-xs">
                      {count(g)}
                    </span>
                  </span>
                  <span className="tabular-nums">{renderSummary(g)}</span>
                </button>
                {open ? <div className="border-t">{entryList(g)}</div> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <Table>
          <TableBody>
            {visible.map((g) => {
              const open = expanded.has(g.date);
              return (
                <Fragment key={g.date}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggle(g.date)}
                  >
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {open ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">
                          {formatDate(g.date)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {count(g)}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {renderSummary(g)}
                    </TableCell>
                  </TableRow>
                  {open ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={2} className="p-0">
                        {entryList(g)}
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
