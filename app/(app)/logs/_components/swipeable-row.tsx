"use client";

import { Trash2 } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

const THRESHOLD = 64;
const MAX = 96;

// Dependency-free swipe-to-delete for mobile cards (ported from v1's
// SwipeableCard, pure touch events). Swipe left past the threshold to ask for
// confirmation before deleting.
export function SwipeableRow({
  children,
  onDelete,
}: {
  children: ReactNode;
  onDelete: () => void;
}) {
  const [dx, setDx] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const startX = useRef<number | null>(null);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex items-center bg-destructive px-5 text-destructive-foreground">
        <Trash2 className="size-5" />
      </div>
      <div
        className="relative touch-pan-y bg-card transition-transform"
        style={{ transform: `translateX(${dx}px)` }}
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          if (startX.current === null) return;
          const delta = e.touches[0].clientX - startX.current;
          setDx(Math.max(-MAX, Math.min(0, delta)));
        }}
        onTouchEnd={() => {
          if (dx < -THRESHOLD) setConfirmOpen(true);
          setDx(0);
          startX.current = null;
        }}
      >
        {children}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this entry?"
        description="This can't be undone."
        confirmLabel="Delete"
        onConfirm={onDelete}
      />
    </div>
  );
}
