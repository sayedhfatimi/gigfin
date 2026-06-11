import { z } from "zod";

// Persisted customizable-dashboard layout. Widget ids are opaque strings — the
// client-side widget registry owns the canonical set, and unknown ids are
// tolerated for forward-compatibility. `timeframe` is validated loosely here
// (any string); the client constrains it to a TimeframeKey. Single source of
// truth for both the Convex `dashboardLayout.save` args and client forms. All
// fields are optional so the timeframe and the widget layout can be saved
// independently (save patch-merges).
export const dashboardLayoutFields = {
  order: z.array(z.string()).optional(),
  hidden: z.array(z.string()).optional(),
  timeframe: z.string().optional(),
};

export const dashboardLayoutSchema = z.object(dashboardLayoutFields);

export type DashboardLayoutInput = z.infer<typeof dashboardLayoutSchema>;
