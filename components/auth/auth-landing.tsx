"use client";

import { useConvexAuth } from "convex/react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AuthLanding({ signupEnabled }: { signupEnabled: boolean }) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  // When sign-in needs a second factor we swap the form for the 2FA challenge.
  const [twoFactor, setTwoFactor] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const isSignup = mode === "signup" && signupEnabled;

  function resetTwoFactor() {
    setTwoFactor(false);
    setUseBackup(false);
    setCode("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const res = await authClient.signUp.email({ email, password, name });
        if (res.error) {
          toast.error(res.error.message ?? "Authentication failed");
        } else {
          router.replace("/dashboard");
        }
        return;
      }
      const res = await authClient.signIn.email({ email, password });
      if (res.error) {
        toast.error(res.error.message ?? "Authentication failed");
      } else if (res.data && "twoFactorRedirect" in res.data) {
        // Password was correct; a second factor is required before a session
        // is issued. Show the code challenge instead of redirecting.
        setTwoFactor(true);
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(value: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = useBackup
        ? await authClient.twoFactor.verifyBackupCode({ code: value })
        : await authClient.twoFactor.verifyTotp({ code: value });
      if (res.error) {
        toast.error(res.error.message ?? "Invalid code");
        setCode("");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/logo.png" alt="GigFin" width={56} height={56} priority />
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">GigFin</h1>
          <p className="text-muted-foreground text-sm">
            Your gig income &amp; expense ledger.
          </p>
        </div>
      </div>

      <Card>
        {twoFactor ? (
          <>
            <CardHeader>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>
                {useBackup
                  ? "Enter one of your saved backup codes."
                  : "Enter the 6-digit code from your authenticator app."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitCode(code);
                }}
                className="space-y-4"
              >
                {useBackup ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="backup-code">Backup code</Label>
                    <Input
                      id="backup-code"
                      autoComplete="one-time-code"
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      autoFocus
                      value={code}
                      onChange={setCode}
                      onComplete={submitCode}
                      disabled={busy}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy || !code}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </form>

              <div className="mt-4 flex flex-col items-center gap-2 text-muted-foreground text-sm">
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setUseBackup((v) => !v);
                    setCode("");
                  }}
                >
                  {useBackup
                    ? "Use your authenticator app instead"
                    : "Use a backup code instead"}
                </button>
                <button
                  type="button"
                  className="underline-offset-4 hover:underline"
                  onClick={resetTwoFactor}
                >
                  Back to sign in
                </button>
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>
                {isSignup ? "Create your account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isSignup
                  ? "Start tracking your earnings."
                  : "Sign in to your ledger."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                {isSignup && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isSignup ? (
                    "Sign up"
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              {signupEnabled && (
                <p className="mt-4 text-center text-muted-foreground text-sm">
                  {mode === "signin" ? "No account?" : "Have an account?"}{" "}
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() =>
                      setMode(mode === "signin" ? "signup" : "signin")
                    }
                  >
                    {mode === "signin" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
