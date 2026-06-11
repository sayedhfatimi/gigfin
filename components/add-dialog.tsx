"use client";

import { Plus } from "lucide-react";
import { type ReactElement, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// A button (or custom `trigger`) that opens a dialog. `children` is a render
// function given a `close` callback to dismiss the dialog on success. Pass
// `trigger` to reuse this for edit (e.g. a pencil button) instead of "Add".
export function AddDialog({
  title,
  description,
  triggerLabel = "Add",
  trigger,
  children,
}: {
  title: string;
  description?: string;
  triggerLabel?: string;
  trigger?: ReactElement;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm">
              <Plus className="size-4" />
              {triggerLabel}
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
