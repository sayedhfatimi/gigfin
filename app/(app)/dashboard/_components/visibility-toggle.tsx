"use client";

import { Eye, EyeOff } from "lucide-react";

// Eye toggle shown on a widget in customize mode. Top-left so it doesn't collide
// with the drag handle (top-right).
export function VisibilityToggle({
  hidden,
  onToggle,
}: {
  hidden: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={hidden ? "Show widget" : "Hide widget"}
      className="absolute top-2 left-2 z-10 rounded-md bg-background/80 p-1 text-muted-foreground ring-1 ring-border hover:text-foreground"
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}
