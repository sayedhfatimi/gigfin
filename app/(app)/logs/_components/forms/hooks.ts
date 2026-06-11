"use client";

import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";

// Vehicle dropdown state that defaults to the user's default vehicle on a NEW
// entry (once the list loads), but never overrides an existing/edited value.
export function useVehicleField(initialId?: string) {
  const vehicles = useQuery(api.vehicles.list);
  const [vehicleId, setVehicleId] = useState(initialId ?? "none");
  const defaulted = useRef(false);
  useEffect(() => {
    if (initialId || defaulted.current || !vehicles) return;
    defaulted.current = true;
    const def = vehicles.find((v) => v.isDefault);
    if (def) setVehicleId(def._id);
  }, [initialId, vehicles]);
  return { vehicles, vehicleId, setVehicleId };
}

// Distinct, trimmed platform names already used (income + shifts), for input
// autocomplete so "Uber"/"uber" don't fragment into separate platforms.
export function usePlatformSuggestions() {
  const income = useQuery(api.income.list);
  const shifts = useQuery(api.shifts.list);
  return useMemo(() => {
    const set = new Set<string>();
    for (const r of income ?? []) {
      const p = r.platform?.trim();
      if (p) set.add(p);
    }
    for (const s of shifts ?? []) {
      const p = s.platform?.trim();
      if (p) set.add(p);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [income, shifts]);
}
