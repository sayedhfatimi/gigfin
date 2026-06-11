import { v } from "convex/values";
import { unitRateUnitValidator } from "./lib/constants";
import { authedMutationV, authedQueryV } from "./lib/functions";
import { requireOwner } from "./lib/owner";

const fields = {
  label: v.string(),
  unitRateMinor: v.number(),
  unitRateUnit: unitRateUnitValidator,
};

export const list = authedQueryV({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("chargingVendors")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect(),
});

export const add = authedMutationV({
  args: fields,
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("chargingVendors", {
      userId: ctx.userId,
      label: args.label.trim(),
      unitRateMinor: args.unitRateMinor,
      unitRateUnit: args.unitRateUnit,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authedMutationV({
  args: { id: v.id("chargingVendors"), ...fields },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.patch(args.id, {
      label: args.label.trim(),
      unitRateMinor: args.unitRateMinor,
      unitRateUnit: args.unitRateUnit,
      updatedAt: Date.now(),
    });
  },
});

export const remove = authedMutationV({
  args: { id: v.id("chargingVendors") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.delete(args.id);
  },
});
