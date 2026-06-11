"use client";

import { useState } from "react";

// Shared toolbar state for a log panel: free-text search + an inclusive ISO
// date range. Domain-specific filters (vehicle/type/platform) are composed by
// each panel on top of these.
export function useLogFilters() {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return { query, setQuery, from, setFrom, to, setTo };
}

export function withinRange(date: string, from: string, to: string): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function matchesText(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}
