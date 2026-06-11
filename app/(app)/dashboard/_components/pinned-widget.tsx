"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HideButton } from "./visibility-toggle";

// A pinned widget: not reorderable, but can still be hidden in customize mode.
export function PinnedWidget({
  customizing,
  widthClass,
  onHide,
  children,
}: {
  customizing: boolean;
  widthClass?: string;
  onHide: () => void;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative", widthClass)}>
      {customizing && <HideButton onHide={onHide} />}
      {children}
    </div>
  );
}
