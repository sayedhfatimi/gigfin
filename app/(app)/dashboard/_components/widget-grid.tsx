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
import { CustomizeSheet } from "./customize-sheet";
import { DashboardHeader } from "./dashboard-header";
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
      />

      {data.loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {cfg.pinnedIds.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {cfg.pinnedIds.map((id) => (
                <div key={id} className={cfg.metaMap[id]?.widthClass}>
                  {renderWidget(id)}
                </div>
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
            <SortableContext
              items={cfg.sortableIds}
              strategy={rectSortingStrategy}
            >
              <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cfg.sortableIds.map((id) => (
                  <SortableWidget
                    key={id}
                    id={id}
                    customizing={cfg.isCustomizing}
                    widthClass={cfg.metaMap[id]?.widthClass}
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

      <CustomizeSheet
        open={cfg.isCustomizing}
        widgets={WIDGETS}
        hiddenSet={cfg.hiddenSet}
        onToggle={cfg.toggle}
        onReset={cfg.reset}
        onDone={cfg.finishCustomizing}
        onCancel={cfg.cancelCustomizing}
      />
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
