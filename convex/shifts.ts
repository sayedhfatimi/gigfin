import { zid } from "convex-helpers/server/zod";
import { z } from "zod";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { appError, ERROR_CODES } from "./lib/errors";
import { authedMutation, authedQuery } from "./lib/functions";
import { requireOwner } from "./lib/owner";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const minutes = z.number().int().min(0).max(1439);

const fields = {
  date,
  startMinutes: minutes,
  endMinutes: minutes,
  platform: z.string().trim().max(80).optional(),
  vehicleId: zid("vehicles").optional(),
  notes: z.string().trim().max(500).optional(),
};

// Minutes worked, treating end-before-start as crossing midnight.
function durationOf(start: number, end: number): number {
  return end >= start ? end - start : 1440 - start + end;
}

async function assertOwnedVehicle(
  ctx: QueryCtx,
  userId: string,
  vehicleId: Id<"vehicles"> | undefined,
) {
  if (!vehicleId) return;
  requireOwner(userId, await ctx.db.get(vehicleId));
}

export const list = authedQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("shifts")
      .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .collect(),
});

export const add = authedMutation({
  args: fields,
  handler: async (ctx, args) => {
    await assertOwnedVehicle(ctx, ctx.userId, args.vehicleId);
    const now = Date.now();
    return ctx.db.insert("shifts", {
      userId: ctx.userId,
      ...args,
      durationMin: durationOf(args.startMinutes, args.endMinutes),
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Live logging: one-tap start (client passes its local now). At most one open
// shift at a time.
export const start = authedMutation({
  args: {
    date,
    startMinutes: minutes,
    platform: z.string().trim().max(80).optional(),
    vehicleId: zid("vehicles").optional(),
    notes: z.string().trim().max(500).optional(),
  },
  handler: async (ctx, args) => {
    await assertOwnedVehicle(ctx, ctx.userId, args.vehicleId);
    const rows = await ctx.db
      .query("shifts")
      .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
      .collect();
    if (rows.some((s) => s.endMinutes === undefined)) {
      throw appError(
        ERROR_CODES.INVALID_INPUT,
        "You already have an active shift. End it first.",
      );
    }
    const now = Date.now();
    return ctx.db.insert("shifts", {
      userId: ctx.userId,
      date: args.date,
      startMinutes: args.startMinutes,
      platform: args.platform,
      vehicleId: args.vehicleId,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Close an open shift, computing its duration (handles midnight wrap).
export const end = authedMutation({
  args: { id: zid("shifts"), endMinutes: minutes },
  handler: async (ctx, args) => {
    const shift = requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.patch(args.id, {
      endMinutes: args.endMinutes,
      durationMin: durationOf(shift.startMinutes, args.endMinutes),
      updatedAt: Date.now(),
    });
  },
});

export const update = authedMutation({
  args: { id: zid("shifts"), ...fields },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await assertOwnedVehicle(ctx, ctx.userId, args.vehicleId);
    const { id, ...rest } = args;
    await ctx.db.patch(id, {
      ...rest,
      durationMin: durationOf(args.startMinutes, args.endMinutes),
      updatedAt: Date.now(),
    });
  },
});

export const remove = authedMutation({
  args: { id: zid("shifts") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.delete(args.id);
  },
});
