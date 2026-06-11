"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Route-group error boundary. Catches render-time errors (e.g. a reactive query
// briefly throwing while the auth session/token rotates) so the app shows a
// recoverable prompt instead of a blank "couldn't load" screen.
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">
          This can happen right after a security change. Try again.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
