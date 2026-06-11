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
import { Eye } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
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

  // The grid always shows only the enabled widgets in their real positions — so
  // customize mode reflects the actual layout. Hidden widgets live in the tray.
  const pinnedIds = cfg.order.filter(
    (id) => cfg.metaMap[id]?.pinned && !cfg.hiddenSet.has(id),
  );
  const sortableIds = cfg.order.filter(
    (id) => !cfg.metaMap[id]?.pinned && !cfg.hiddenSet.has(id),
  );
  const hiddenIds = cfg.isCustomizing
    ? cfg.order.filter((id) => cfg.hiddenSet.has(id))
    : [];

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

      {cfg.isCustomizing && hiddenIds.length > 0 && (
        <div className="rounded-lg border border-dashed p-4">
          <p className="mb-3 font-medium text-muted-foreground text-sm">
            Hidden widgets
          </p>
          <div className="flex flex-wrap gap-2">
            {hiddenIds.map((id) => {
              const meta = cfg.metaMap[id];
              if (!meta) return null;
              return (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  onClick={() => cfg.toggle(id)}
                >
                  <Eye className="size-4" />
                  {meta.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

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
                  widthClass={cfg.metaMap[id]?.widthClass}
                  onHide={() => cfg.toggle(id)}
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
                    widthClass={cfg.metaMap[id]?.widthClass}
                    onHide={() => cfg.toggle(id)}
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
