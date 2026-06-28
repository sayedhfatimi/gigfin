"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { AppSidebar } from "./app-sidebar";

// Authenticated app shell: sidebar + full-width content. Gates on Convex auth
// and bootstraps the user profile on first load.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const ensureProfile = useMutation(api.profiles.ensure);
  const materializeRecurring = useMutation(api.recurring.materializeMine);
  const materializeRecurringIncome = useMutation(
    api.recurringIncome.materializeMine,
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      ensureProfile({}).catch(() => {});
      // Catch up any due recurring expenses/income now instead of waiting for
      // the cron.
      materializeRecurring({}).catch(() => {});
      materializeRecurringIncome({}).catch(() => {});
    }
  }, [
    isAuthenticated,
    ensureProfile,
    materializeRecurring,
    materializeRecurringIncome,
  ]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="flex h-12 items-center gap-2 border-b px-4 md:hidden print:hidden">
            <SidebarTrigger />
            <span className="font-semibold">GigFin</span>
          </header>
          <div className="w-full flex-1 p-4 md:p-6 lg:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
