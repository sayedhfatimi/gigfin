"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  onDelete,
}: {
  onDelete: () => Promise<unknown>;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Delete"
      onClick={() => {
        onDelete().catch(() => toast.error("Failed to delete"));
      }}
    >
      <Trash2 className="size-4 text-muted-foreground" />
    </Button>
  );
}

// Pencil-triggered dialog reusing AddDialog in edit mode.
export function EditDialog({
  title,
  children,
}: {
  title: string;
  children: (close: () => void) => ReactNode;
}) {
  return (
    <AddDialog
      title={title}
      trigger={
        <Button variant="ghost" size="icon" aria-label="Edit">
          <Pencil className="size-4 text-muted-foreground" />
        </Button>
      }
    >
      {children}
    </AddDialog>
  );
}
