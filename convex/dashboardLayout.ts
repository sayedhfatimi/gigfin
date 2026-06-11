import { dashboardLayoutFields } from "../lib/schemas/dashboard-layout";
import { authedMutation, authedQuery } from "./lib/functions";

// One layout row per user (upserted). Ownership is implicit: every query is
// scoped to ctx.userId via the by_user index, mirroring profiles.ts.

export const getMine = authedQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("dashboardLayouts")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .unique(),
});

export const save = authedMutation({
  args: dashboardLayoutFields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dashboardLayouts")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("dashboardLayouts", {
      userId: ctx.userId,
      ...args,
      updatedAt: now,
    });
  },
});

// Drop the saved layout so the dashboard falls back to registry defaults.
export const reset = authedMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("dashboardLayouts")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
