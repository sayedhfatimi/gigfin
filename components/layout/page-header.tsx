"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Standard detail-page header with an optional ghost icon back button — one
 * source of truth for back navigation across detail pages. Provide either
 * `backHref` (renders a Link) or `onBack`. `children` render right-aligned as
 * page actions.
 */
export function PageHeader({
  backHref,
  onBack,
  backLabel = "Back",
  title,
  description,
  children,
}: {
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  const hasBack = Boolean(backHref || onBack);

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {hasBack &&
          (backHref ? (
            <Button
              variant="ghost"
              size="icon"
              render={<Link href={backHref} aria-label={backLabel} />}
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={backLabel}
              onClick={onBack}
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Button>
          ))}
        <div className="min-w-0 space-y-1">
          {title ? (
            <h1 className="truncate font-semibold text-2xl tracking-tight">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </header>
  );
}
