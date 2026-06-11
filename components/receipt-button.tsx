"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, Paperclip } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Per-expense receipt attachment using self-hosted Convex file storage.
export function ReceiptButton({ expenseId }: { expenseId: Id<"expenses"> }) {
  const receipts = useQuery(api.receipts.getForExpense, { expenseId });
  const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);
  const attach = useMutation(api.receipts.attach);
  const remove = useMutation(api.receipts.remove);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Id<"receipts"> | null>(
    null,
  );

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("upload failed");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      await attach({ expenseId, storageId, mime: file.type });
      toast.success("Receipt attached");
    } catch {
      toast.error("Receipt upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {receipts?.map((r, i) =>
        r.url ? (
          <a
            key={r._id}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary text-xs underline-offset-2 hover:underline"
            onClick={(e) => {
              if (e.shiftKey) {
                e.preventDefault();
                setPendingRemove(r._id);
              }
            }}
            title="Open receipt (shift-click to remove)"
          >
            #{i + 1}
          </a>
        ) : null,
      )}
      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(o) => {
          if (!o) setPendingRemove(null);
        }}
        title="Remove this receipt?"
        confirmLabel="Remove"
        onConfirm={async () => {
          if (pendingRemove) {
            await remove({ id: pendingRemove }).catch(() =>
              toast.error("Failed to remove"),
            );
          }
          setPendingRemove(null);
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Attach receipt"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Paperclip className="size-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
