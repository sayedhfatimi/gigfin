"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

// TEMPORARY Phase-2 smoke screen: proves Better Auth + self-hosted Convex +
// reactive queries work end to end. Replaced by the real landing/auth UI in
// Phase 3.
export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const currentUser = useQuery(api.auth.getCurrentUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(
    fn: () => Promise<{ error?: { message?: string } | null }>,
  ) {
    setBusy(true);
    try {
      const res = await fn();
      if (res.error) toast.error(res.error.message ?? "Something went wrong");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="GigFin" width={44} height={44} priority />
        <h1 className="font-semibold text-2xl tracking-tight">GigFin</h1>
      </div>

      {isPending ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : session ? (
        <div className="space-y-4 rounded-lg border bg-card p-5">
          <p className="text-sm">
            Signed in as{" "}
            <span className="font-medium">{session.user.email}</span>
          </p>
          <p className="text-muted-foreground text-xs">
            Convex sees user id: <code>{currentUser?._id ?? "…"}</code>
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => authClient.signOut())}
            className="rounded-md bg-secondary px-3 py-2 text-secondary-foreground text-sm"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border bg-card p-5">
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Name (sign up)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(() => authClient.signIn.email({ email, password }))
              }
              className="flex-1 rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm"
            >
              Sign in
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(() => authClient.signUp.email({ email, password, name }))
              }
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            >
              Sign up
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
