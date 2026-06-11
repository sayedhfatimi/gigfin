"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WidgetMeta } from "./widget-types";

type SavedLayout = { order?: string[]; hidden?: string[] } | null | undefined;

const orderIds = (widgets: WidgetMeta[]) => widgets.map((w) => w.id);
const defaultHiddenIds = (widgets: WidgetMeta[]) =>
  widgets.filter((w) => w.defaultHidden).map((w) => w.id);

// Keep stored order valid against the current registry: drop unknown ids, append
// newly-added widgets at the end (forward-compat). Mirrors v1's normalizeStoredOrder.
function normalizeOrder(stored: unknown, widgets: WidgetMeta[]): string[] {
  const ids = orderIds(widgets);
  if (!Array.isArray(stored)) return ids;
  const known = new Set(ids);
  const filtered = stored.filter(
    (v): v is string => typeof v === "string" && known.has(v),
  );
  return [...filtered, ...ids.filter((id) => !filtered.includes(id))];
}

function normalizeHidden(stored: unknown, widgets: WidgetMeta[]): string[] {
  if (!Array.isArray(stored)) return defaultHiddenIds(widgets);
  const known = new Set(orderIds(widgets));
  return stored.filter(
    (v): v is string => typeof v === "string" && known.has(v),
  );
}

// Manages widget order + visibility + customize mode + drag handlers, persisting
// to Convex via `onPersist` (replaces v1's localStorage).
export function useWidgetConfig(
  widgets: WidgetMeta[],
  saved: SavedLayout,
  onPersist: (order: string[], hidden: string[]) => void,
) {
  const [order, setOrder] = useState(() => orderIds(widgets));
  const [hidden, setHidden] = useState(() => defaultHiddenIds(widgets));
  const [committed, setCommitted] = useState(() => ({
    order: orderIds(widgets),
    hidden: defaultHiddenIds(widgets),
  }));
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const loaded = useRef(false);

  // Seed from the saved layout once it has loaded.
  useEffect(() => {
    if (loaded.current || saved === undefined) return;
    loaded.current = true;
    const o = normalizeOrder(saved?.order, widgets);
    const h = normalizeHidden(saved?.hidden, widgets);
    setOrder(o);
    setHidden(h);
    setCommitted({ order: o, hidden: h });
  }, [saved, widgets]);

  const metaMap = useMemo(
    () =>
      Object.fromEntries(widgets.map((w) => [w.id, w])) as Record<
        string,
        WidgetMeta
      >,
    [widgets],
  );
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);
  const pinnedIds = useMemo(
    () => order.filter((id) => metaMap[id]?.pinned && !hiddenSet.has(id)),
    [order, metaMap, hiddenSet],
  );
  const sortableIds = useMemo(
    () => order.filter((id) => !metaMap[id]?.pinned && !hiddenSet.has(id)),
    [order, metaMap, hiddenSet],
  );

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => setActiveId(String(active.id)),
    [],
  );
  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setOrder((cur) => {
      const oldIndex = cur.indexOf(String(active.id));
      const newIndex = cur.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return cur;
      return arrayMove(cur, oldIndex, newIndex);
    });
  }, []);
  const handleDragCancel = useCallback(() => setActiveId(null), []);

  const toggle = useCallback(
    (id: string) =>
      setHidden((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [],
  );

  const startCustomizing = useCallback(() => setIsCustomizing(true), []);
  const finishCustomizing = useCallback(() => {
    setIsCustomizing(false);
    setActiveId(null);
    setCommitted({ order, hidden });
    onPersist(order, hidden);
  }, [order, hidden, onPersist]);
  const cancelCustomizing = useCallback(() => {
    setOrder(committed.order);
    setHidden(committed.hidden);
    setIsCustomizing(false);
    setActiveId(null);
  }, [committed]);
  const reset = useCallback(() => {
    const o = orderIds(widgets);
    const h = defaultHiddenIds(widgets);
    setOrder(o);
    setHidden(h);
    setCommitted({ order: o, hidden: h });
    onPersist(o, h);
  }, [widgets, onPersist]);

  return {
    order,
    hidden,
    hiddenSet,
    isCustomizing,
    activeId,
    metaMap,
    pinnedIds,
    sortableIds,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    toggle,
    startCustomizing,
    finishCustomizing,
    cancelCustomizing,
    reset,
  };
}
