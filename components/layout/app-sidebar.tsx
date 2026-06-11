"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import {
  type NavItem,
  SIDEBAR_PRIMARY_LINKS,
  SIDEBAR_SECONDARY_LINKS,
} from "@/lib/nav";
import { APP_VERSION } from "@/lib/version";

const ALL_HREFS = [
  ...SIDEBAR_PRIMARY_LINKS.map((i) => i.href),
  ...SIDEBAR_SECONDARY_LINKS.map((i) => i.href),
];

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname() ?? "";
  // Active = the longest sidebar href that prefixes the current path.
  const longest = ALL_HREFS.filter(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  ).reduce((best, href) => (href.length > best.length ? href : best), "");
  const isActive = longest === item.href;
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.name}
        render={
          <Link href={item.href}>
            <Icon />
            <span>{item.name}</span>
          </Link>
        }
      />
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/");
  }

  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-0">
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:flex-none"
            aria-label="GigFin home"
          >
            <Image
              src="/logo.png"
              alt="GigFin"
              width={28}
              height={28}
              className="size-7 shrink-0"
            />
            <span className="truncate font-semibold text-primary group-data-[collapsible=icon]:hidden">
              GigFin
            </span>
          </Link>
          <SidebarTrigger className="shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {SIDEBAR_PRIMARY_LINKS.map((item) => (
                <SidebarLink key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {SIDEBAR_SECONDARY_LINKS.map((item) => (
                <SidebarLink key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-0">
          <span className="font-mono text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
            v{APP_VERSION}
          </span>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
