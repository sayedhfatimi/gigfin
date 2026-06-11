"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { WidgetMeta } from "./widget-types";

// Show/hide widgets + reset. Reordering happens by dragging cards in the grid
// while this panel is open.
export function CustomizeSheet({
  open,
  widgets,
  hiddenSet,
  onToggle,
  onReset,
  onDone,
  onCancel,
}: {
  open: boolean;
  widgets: WidgetMeta[];
  hiddenSet: Set<string>;
  onToggle: (id: string) => void;
  onReset: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Customize dashboard</SheetTitle>
          <SheetDescription>
            Toggle widgets on or off. Drag cards in the grid to reorder.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {widgets.map((w) => (
            <div key={w.id} className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor={`toggle-${w.id}`}>{w.label}</Label>
                <p className="text-muted-foreground text-xs">{w.description}</p>
              </div>
              <Switch
                id={`toggle-${w.id}`}
                checked={!hiddenSet.has(w.id)}
                onCheckedChange={() => onToggle(w.id)}
              />
            </div>
          ))}
        </div>

        <SheetFooter className="flex-row justify-between">
          <Button variant="ghost" onClick={onReset}>
            Reset
          </Button>
          <Button onClick={onDone}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
