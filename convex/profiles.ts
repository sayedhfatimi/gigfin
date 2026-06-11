import { v } from "convex/values";
import {
  odometerUnitValidator,
  taxJurisdictionValidator,
  unitSystemValidator,
  volumeUnitValidator,
} from "./lib/constants";
import { appError, ERROR_CODES } from "./lib/errors";
import { authedMutationV, authedQueryV } from "./lib/functions";

const DEFAULTS = {
  currency: "GBP",
  unitSystem: "metric",
  volumeUnit: "litre",
  odometerUnit: "km",
  taxJurisdiction: "UK",
} as const;

export const getMine = authedQueryV({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .unique(),
});

// Create the profile with defaults on first use (idempotent).
export const ensure = authedMutationV({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .unique();
    if (existing) return existing._id;
    const now = Date.now();
    return ctx.db.insert("profiles", {
      userId: ctx.userId,
      ...DEFAULTS,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSettings = authedMutationV({
  args: {
    currency: v.optional(v.string()),
    unitSystem: v.optional(unitSystemValidator),
    volumeUnit: v.optional(volumeUnitValidator),
    odometerUnit: v.optional(odometerUnitValidator),
    taxJurisdiction: v.optional(taxJurisdictionValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .unique();
    if (!existing) {
      throw appError(ERROR_CODES.NOT_FOUND, "Profile not found.");
    }
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(existing._id, patch);
  },
});
