import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "GigFin",
  description:
    "Self-hosted, privacy-first income & expense ledger for gig workers.",
  applicationName: "GigFin",
  appleWebApp: { capable: true, title: "GigFin", statusBarStyle: "default" },
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#108050",
};

// Rendered per-request so the Convex URL is read from runtime env (not baked at
// build) — lets one image serve any self-hosted backend.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Browser-reachable Convex URL (the loopback/LAN/public address the user's
  // browser hits). Distinct from the server-internal CONVEX_URL (backend:3210)
  // that lib/auth-server.ts uses to proxy auth in-network.
  const convexUrl =
    process.env.CONVEX_PUBLIC_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers convexUrl={convexUrl}>{children}</Providers>
      </body>
    </html>
  );
}
