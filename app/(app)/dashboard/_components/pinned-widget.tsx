"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VisibilityToggle } from "./visibility-toggle";

// A pinned widget: not reorderable, but still gets a visibility toggle in
// customize mode.
export function PinnedWidget({
  customizing,
  hidden,
  widthClass,
  onToggleVisibility,
  children,
}: {
  customizing: boolean;
  hidden: boolean;
  widthClass?: string;
  onToggleVisibility: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative",
        widthClass,
        customizing && hidden && "opacity-50",
      )}
    >
      {customizing && (
        <VisibilityToggle hidden={hidden} onToggle={onToggleVisibility} />
      )}
      {children}
    </div>
  );
}
