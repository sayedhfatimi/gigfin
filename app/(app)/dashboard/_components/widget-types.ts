import type { ComponentType } from "react";
import type { DashboardData } from "@/lib/hooks/use-dashboard-data";

// `global` widgets follow the dashboard's timeframe control; `fixed` widgets own
// their period (today / tax-year / annual / a goal's own period) and ignore it.
export type TimeframeMode = "global" | "fixed";

export type WidgetProps = { data: DashboardData };

export type WidgetMeta = {
  id: string;
  label: string;
  description: string;
  timeframeMode: TimeframeMode;
  /** Grid column span on the sortable grid, e.g. "lg:col-span-2". */
  widthClass?: string;
  /** Pinned widgets render above the sortable grid and can't be reordered. */
  pinned?: boolean;
  /** Hidden until the user enables it in the customize panel. */
  defaultHidden?: boolean;
  component: ComponentType<WidgetProps>;
};
