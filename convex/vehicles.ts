import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { vehicleTypeValidator } from "./lib/constants";
import { authedMutationV, authedQueryV } from "./lib/functions";
import { requireOwner } from "./lib/owner";

async function clearDefaults(ctx: MutationCtx, userId: string) {
  const current = await ctx.db
    .query("vehicles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("isDefault"), true))
    .collect();
  await Promise.all(
    current.map((v) => ctx.db.patch(v._id, { isDefault: false })),
  );
}

// On delete, null out references rather than leaving dangling ids.
async function clearVehicleRefs(ctx: MutationCtx, vehicleId: Id<"vehicles">) {
  for (const table of ["expenses", "odometers"] as const) {
    const refs = await ctx.db
      .query(table)
      .withIndex("by_vehicle_date", (q) => q.eq("vehicleId", vehicleId))
      .collect();
    await Promise.all(
      refs.map((r) => ctx.db.patch(r._id, { vehicleId: undefined })),
    );
  }
  for (const table of ["shifts", "recurringExpenses"] as const) {
    const refs = await ctx.db
      .query(table)
      .filter((q) => q.eq(q.field("vehicleId"), vehicleId))
      .collect();
    await Promise.all(
      refs.map((r) => ctx.db.patch(r._id, { vehicleId: undefined })),
    );
  }
}

export const list = authedQueryV({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("vehicles")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect(),
});

export const add = authedMutationV({
  args: {
    label: v.string(),
    vehicleType: vehicleTypeValidator,
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.isDefault) await clearDefaults(ctx, ctx.userId);
    const now = Date.now();
    return ctx.db.insert("vehicles", {
      userId: ctx.userId,
      label: args.label.trim(),
      vehicleType: args.vehicleType,
      isDefault: args.isDefault,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authedMutationV({
  args: {
    id: v.id("vehicles"),
    label: v.string(),
    vehicleType: vehicleTypeValidator,
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    if (args.isDefault) await clearDefaults(ctx, ctx.userId);
    await ctx.db.patch(args.id, {
      label: args.label.trim(),
      vehicleType: args.vehicleType,
      isDefault: args.isDefault,
      updatedAt: Date.now(),
    });
  },
});

export const remove = authedMutationV({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await clearVehicleRefs(ctx, args.id);
    await ctx.db.delete(args.id);
  },
});
