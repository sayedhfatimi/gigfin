"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ParticleBackground } from "@/components/effects/particle-background";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <ParticleBackground />
        <div className="relative z-10">{children}</div>
        <Toaster richColors closeButton />
      </ConvexBetterAuthProvider>
    </ThemeProvider>
  );
}
