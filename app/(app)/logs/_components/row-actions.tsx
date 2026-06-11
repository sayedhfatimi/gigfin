"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { AddDialog } from "@/components/add-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  onDelete,
}: {
  onDelete: () => Promise<unknown>;
}) {
  return (
    <ConfirmDialog
      title="Delete this entry?"
      description="This can't be undone."
      confirmLabel="Delete"
      onConfirm={() => onDelete().catch(() => toast.error("Failed to delete"))}
      trigger={
        <Button variant="ghost" size="icon" aria-label="Delete">
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      }
    />
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
