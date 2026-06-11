"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function SecurityCard() {
  const { data: session } = authClient.useSession();
  const twoFactorEnabled = Boolean(session?.user?.twoFactorEnabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Password and two-factor authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y rounded-lg border">
        <Row
          icon={<KeyRound className="size-4 text-muted-foreground" />}
          title="Password"
          subtitle="Change your account password."
          action={<ChangePasswordDialog />}
        />
        <Row
          icon={<ShieldCheck className="size-4 text-muted-foreground" />}
          title="Two-factor authentication"
          subtitle={
            twoFactorEnabled
              ? "Enabled — an authenticator code is required at sign-in."
              : "Add a TOTP authenticator app for extra security."
          }
          badge={twoFactorEnabled ? "On" : "Off"}
          action={<TwoFactorDialog enabled={twoFactorEnabled} />}
        />
      </CardContent>
    </Card>
  );
}

function Row({
  icon,
  title,
  subtitle,
  badge,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{title}</span>
            {badge && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                {badge}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (res.error) {
        toast.error(res.error.message ?? "Failed to change password");
      } else {
        toast.success("Password updated");
        setOpen(false);
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Change
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Other sessions will be signed out.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cur-pw">Current password</Label>
            <Input
              id="cur-pw"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Confirm new password</Label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TwoFactorDialog({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<{
    totpURI: string;
    backupCodes: string[];
  } | null>(null);

  function reset() {
    setPassword("");
    setCode("");
    setSetup(null);
  }

  async function startEnable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authClient.twoFactor.enable({ password });
      if (res.error || !res.data) {
        toast.error(res.error?.message ?? "Failed to start setup");
      } else {
        setSetup({
          totpURI: res.data.totpURI,
          backupCodes: res.data.backupCodes,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authClient.twoFactor.verifyTotp({ code });
      if (res.error) {
        toast.error(res.error.message ?? "Invalid code");
      } else {
        toast.success("Two-factor authentication enabled");
        setOpen(false);
        reset();
      }
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authClient.twoFactor.disable({ password });
      if (res.error) {
        toast.error(res.error.message ?? "Failed to disable");
      } else {
        toast.success("Two-factor authentication disabled");
        setOpen(false);
        reset();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            {enabled ? "Disable" : "Enable"}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {enabled ? "Disable two-factor" : "Enable two-factor"}
          </DialogTitle>
          <DialogDescription>
            {enabled
              ? "Enter your password to turn off 2FA."
              : setup
                ? "Scan the QR with your authenticator, then enter a code."
                : "Confirm your password to begin setup."}
          </DialogDescription>
        </DialogHeader>

        {enabled ? (
          <form onSubmit={disable} className="space-y-4">
            <PasswordField value={password} onChange={setPassword} />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={busy}>
                {busy ? "Disabling…" : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </form>
        ) : setup ? (
          <form onSubmit={verify} className="space-y-4">
            <div className="flex justify-center rounded-lg border bg-white p-4">
              <QRCode value={setup.totpURI} size={160} />
            </div>
            <div className="space-y-1.5">
              <Label>Backup codes</Label>
              <div className="grid grid-cols-2 gap-1.5 rounded-md border p-2 font-mono text-xs">
                {setup.backupCodes.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Save these somewhere safe — they let you sign in if you lose
                your device.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totp-code">Authenticator code</Label>
              <Input
                id="totp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? "Verifying…" : "Verify & enable"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={startEnable} className="space-y-4">
            <PasswordField value={password} onChange={setPassword} />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? "…" : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="confirm-password">Password</Label>
      <Input
        id="confirm-password"
        type="password"
        autoComplete="current-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
