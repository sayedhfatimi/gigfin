"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// Shared form shell for add/edit dialogs. `onSubmit` returns true to close.
export function EntryForm({
  submitLabel,
  onSubmit,
  onDone,
  children,
}: {
  submitLabel: string;
  onSubmit: () => Promise<boolean>;
  onDone: () => void;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  async function handle(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (await onSubmit()) onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={handle} className="space-y-4">
      {children}
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
