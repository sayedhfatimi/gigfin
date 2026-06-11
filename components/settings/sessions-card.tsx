"use client";

import { Loader2, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

type SessionRow = {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string | number | Date;
  expiresAt: string | number | Date;
};

function describeDevice(ua?: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
        ? "Firefox"
        : /Safari/.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS|Macintosh/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iOS/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

function formatWhen(value: string | number | Date): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SessionsCard() {
  const { data: session } = authClient.useSession();
  const currentToken = session?.session?.token;
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await authClient.listSessions();
    if (res.error) {
      toast.error(res.error.message ?? "Failed to load sessions");
      setRows([]);
    } else {
      setRows((res.data ?? []) as SessionRow[]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(token: string) {
    setBusy(true);
    try {
      const res = await authClient.revokeSession({ token });
      if (res.error) toast.error(res.error.message ?? "Failed to revoke");
      else await load();
    } finally {
      setBusy(false);
    }
  }

  async function revokeOthers() {
    setBusy(true);
    try {
      const res = await authClient.revokeOtherSessions();
      if (res.error) toast.error(res.error.message ?? "Failed");
      else {
        toast.success("Other sessions signed out");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  const others = (rows ?? []).filter((r) => r.token !== currentToken);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>
              Devices currently signed in to your account.
            </CardDescription>
          </div>
          <ConfirmDialog
            title="Sign out other devices?"
            description="All sessions except this one will be signed out."
            confirmLabel="Sign out others"
            onConfirm={revokeOthers}
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={busy || others.length === 0}
              >
                <LogOut className="size-4" />
                Sign out others
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active sessions.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((r) => {
              const isCurrent = r.token === currentToken;
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {describeDevice(r.userAgent)}
                      </span>
                      {isCurrent && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {r.ipAddress || "Unknown IP"} · expires{" "}
                      {formatWhen(r.expiresAt)}
                    </p>
                  </div>
                  {!isCurrent && (
                    <ConfirmDialog
                      title="Revoke this session?"
                      description="That device will be signed out."
                      confirmLabel="Revoke"
                      onConfirm={() => revoke(r.token)}
                      trigger={
                        <Button variant="ghost" size="sm" disabled={busy}>
                          Revoke
                        </Button>
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
