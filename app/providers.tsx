"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";
import { ParticleBackground } from "@/components/effects/particle-background";
import { authClient } from "@/lib/auth-client";

export function Providers({
  children,
  convexUrl,
}: {
  children: React.ReactNode;
  convexUrl: string;
}) {
  // Created once; URL is provided at runtime by the server layout so a single
  // built image works against any self-hosted Convex backend.
  const [convex] = useState(() => new ConvexReactClient(convexUrl));

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
