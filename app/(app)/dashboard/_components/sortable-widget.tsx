"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Wraps a widget so it can be dragged to reorder while customizing. The drag
// handle only appears in customize mode; otherwise the widget renders normally.
export function SortableWidget({
  id,
  customizing,
  widthClass,
  children,
}: {
  id: string;
  customizing: boolean;
  widthClass?: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !customizing });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative",
        widthClass,
        customizing &&
          "ring-1 ring-border ring-offset-2 ring-offset-background",
        isDragging && "z-10 opacity-60",
      )}
    >
      {customizing && (
        <button
          type="button"
          aria-label="Drag to reorder"
          className="absolute top-2 right-2 z-10 cursor-grab rounded-md bg-background/80 p-1 text-muted-foreground ring-1 ring-border hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      {children}
    </div>
  );
}
