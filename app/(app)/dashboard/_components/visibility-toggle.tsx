"use client";

import { EyeOff } from "lucide-react";

// "Hide" affordance shown on a visible widget in customize mode (top-left, clear
// of the drag handle at top-right). Hiding moves the widget to the tray below.
export function HideButton({ onHide }: { onHide: () => void }) {
  return (
    <button
      type="button"
      onClick={onHide}
      aria-label="Hide widget"
      className="absolute top-2 left-2 z-10 rounded-md bg-background/80 p-1 text-muted-foreground ring-1 ring-border hover:text-foreground"
    >
      <EyeOff className="size-4" />
    </button>
  );
}
