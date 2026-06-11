import {
  FileText,
  LayoutDashboard,
  type LucideIcon,
  ScrollText,
  Settings,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const SIDEBAR_PRIMARY_LINKS: readonly NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Logs", href: "/logs", icon: ScrollText },
  { name: "Reports", href: "/reports", icon: FileText },
] as const;

export const SIDEBAR_SECONDARY_LINKS: readonly NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
] as const;
