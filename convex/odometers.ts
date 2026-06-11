import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { appError, ERROR_CODES } from "./lib/errors";
import { authedMutationV, authedQueryV } from "./lib/functions";
import { requireOwner } from "./lib/owner";

async function assertOwnedVehicle(
  ctx: QueryCtx,
  userId: string,
  vehicleId: Id<"vehicles"> | undefined,
) {
  if (!vehicleId) return;
  requireOwner(userId, await ctx.db.get(vehicleId));
}

function assertValidReadings(start: number, end: number) {
  if (start < 0 || end < 0) {
    throw appError(ERROR_CODES.INVALID_INPUT, "Readings must be non-negative.");
  }
  if (end < start) {
    throw appError(
      ERROR_CODES.INVALID_INPUT,
      "End reading must be greater than or equal to start reading.",
    );
  }
}

const fields = {
  date: v.string(),
  startReading: v.number(),
  endReading: v.number(),
  vehicleId: v.optional(v.id("vehicles")),
  notes: v.optional(v.string()),
};

export const list = authedQueryV({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("odometers")
      .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .collect(),
});

export const add = authedMutationV({
  args: fields,
  handler: async (ctx, args) => {
    assertValidReadings(args.startReading, args.endReading);
    await assertOwnedVehicle(ctx, ctx.userId, args.vehicleId);
    const now = Date.now();
    return ctx.db.insert("odometers", {
      userId: ctx.userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authedMutationV({
  args: { id: v.id("odometers"), ...fields },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    assertValidReadings(args.startReading, args.endReading);
    await assertOwnedVehicle(ctx, ctx.userId, args.vehicleId);
    const { id, ...rest } = args;
    await ctx.db.patch(id, { ...rest, updatedAt: Date.now() });
  },
});

export const remove = authedMutationV({
  args: { id: v.id("odometers") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.delete(args.id);
  },
});
