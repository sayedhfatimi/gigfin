import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { expenseTypeValidator, unitRateUnitValidator } from "./lib/constants";
import { authedMutationV, authedQueryV } from "./lib/functions";
import { requireOwner } from "./lib/owner";

// Guard: an optional vehicle reference must belong to the same user.
async function assertOwnedVehicle(
  ctx: QueryCtx,
  userId: string,
  vehicleId: Id<"vehicles"> | undefined,
) {
  if (!vehicleId) return;
  requireOwner(userId, await ctx.db.get(vehicleId));
}

const fields = {
  expenseType: expenseTypeValidator,
  amountMinor: v.number(),
  date: v.string(),
  vehicleId: v.optional(v.id("vehicles")),
  notes: v.optional(v.string()),
  unitRateMinor: v.optional(v.number()),
  unitRateUnit: v.optional(unitRateUnitValidator),
};

export const list = authedQueryV({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("expenses")
      .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .collect(),
});

export const add = authedMutationV({
  args: fields,
  handler: async (ctx, args) => {
    await assertOwnedVehicle(ctx, ctx.userId, args.vehicleId);
    const now = Date.now();
    return ctx.db.insert("expenses", {
      userId: ctx.userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authedMutationV({
  args: { id: v.id("expenses"), ...fields },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await assertOwnedVehicle(ctx, ctx.userId, args.vehicleId);
    const { id, ...rest } = args;
    await ctx.db.patch(id, { ...rest, updatedAt: Date.now() });
  },
});

export const remove = authedMutationV({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.delete(args.id);
  },
});
