"use client";

import { Search } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Input } from "@/components/ui/input";

// Search + inclusive date range + an optional domain filter + an action (the
// Add button). The search input ref lets `/` focus it.
export function LogsToolbar({
  searchRef,
  query,
  onQuery,
  from,
  onFrom,
  to,
  onTo,
  extra,
  action,
}: {
  searchRef?: RefObject<HTMLInputElement | null>;
  query: string;
  onQuery: (v: string) => void;
  from: string;
  onFrom: (v: string) => void;
  to: string;
  onTo: (v: string) => void;
  extra?: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-44 flex-1">
        <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
        <Input
          ref={searchRef}
          className="pl-8"
          placeholder="Search…  ( / )"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      <Input
        type="date"
        aria-label="From date"
        className="w-auto"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
      />
      <Input
        type="date"
        aria-label="To date"
        className="w-auto"
        value={to}
        onChange={(e) => onTo(e.target.value)}
      />
      {extra}
      <div className="ml-auto">{action}</div>
    </div>
  );
}
