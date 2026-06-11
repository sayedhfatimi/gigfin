"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";
import { DashboardHeader } from "./dashboard-header";
import { PinnedWidget } from "./pinned-widget";
import { SortableWidget } from "./sortable-widget";
import { useWidgetConfig } from "./use-widget-config";
import { WIDGETS } from "./widget-registry";

type SavedLayout = { order?: string[]; hidden?: string[] } | null;

export function WidgetGrid({ saved }: { saved: SavedLayout }) {
  const data = useDashboardData();
  const save = useMutation(api.dashboardLayout.save);
  const persist = useCallback(
    (order: string[], hidden: string[]) => {
      void save({ order, hidden });
    },
    [save],
  );
  const cfg = useWidgetConfig(WIDGETS, saved, persist);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  // In customize mode hidden widgets stay visible (dimmed) so they can be
  // toggled back on; otherwise only enabled widgets render.
  const isShown = (id: string) => cfg.isCustomizing || !cfg.hiddenSet.has(id);
  const pinnedIds = cfg.order.filter(
    (id) => cfg.metaMap[id]?.pinned && isShown(id),
  );
  const sortableIds = cfg.order.filter(
    (id) => !cfg.metaMap[id]?.pinned && isShown(id),
  );

  const renderWidget = (id: string) => {
    const meta = cfg.metaMap[id];
    if (!meta) return null;
    const Component = meta.component;
    return <Component data={data} />;
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        isCustomizing={cfg.isCustomizing}
        onCustomize={cfg.startCustomizing}
        onDone={cfg.finishCustomizing}
        onReset={cfg.reset}
      />

      {data.loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {pinnedIds.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {pinnedIds.map((id) => (
                <PinnedWidget
                  key={id}
                  customizing={cfg.isCustomizing}
                  hidden={cfg.hiddenSet.has(id)}
                  widthClass={cfg.metaMap[id]?.widthClass}
                  onToggleVisibility={() => cfg.toggle(id)}
                >
                  {renderWidget(id)}
                </PinnedWidget>
              ))}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={cfg.handleDragStart}
            onDragEnd={cfg.handleDragEnd}
            onDragCancel={cfg.handleDragCancel}
          >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortableIds.map((id) => (
                  <SortableWidget
                    key={id}
                    id={id}
                    customizing={cfg.isCustomizing}
                    hidden={cfg.hiddenSet.has(id)}
                    widthClass={cfg.metaMap[id]?.widthClass}
                    onToggleVisibility={() => cfg.toggle(id)}
                  >
                    {renderWidget(id)}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
            <DragOverlay modifiers={[restrictToWindowEdges]}>
              {cfg.activeId ? (
                <div className="opacity-90">{renderWidget(cfg.activeId)}</div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["a", "b", "c", "d", "e", "f"].map((k) => (
          <Skeleton key={k} className="h-48" />
        ))}
      </div>
    </div>
  );
}
