import type { GenericMutationCtx } from "convex/server";
import { v } from "convex/values";
import type { DataModel, Doc } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import {
  expenseTypeValidator,
  recurringCadenceValidator,
} from "./lib/constants";
import { authedMutationV, authedQueryV } from "./lib/functions";
import { requireOwner } from "./lib/owner";
import { advance } from "./lib/recurring";

const fields = {
  expenseType: expenseTypeValidator,
  amountMinor: v.number(),
  cadence: recurringCadenceValidator,
  nextDueDate: v.string(),
  vehicleId: v.optional(v.id("vehicles")),
  notes: v.optional(v.string()),
};

export const list = authedQueryV({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("recurringExpenses")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect(),
});

export const add = authedMutationV({
  args: fields,
  handler: async (ctx, args) => {
    if (args.vehicleId) {
      requireOwner(ctx.userId, await ctx.db.get(args.vehicleId));
    }
    const now = Date.now();
    return ctx.db.insert("recurringExpenses", {
      userId: ctx.userId,
      ...args,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setActive = authedMutationV({
  args: { id: v.id("recurringExpenses"), active: v.boolean() },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.patch(args.id, { active: args.active, updatedAt: Date.now() });
  },
});

export const remove = authedMutationV({
  args: { id: v.id("recurringExpenses") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.delete(args.id);
  },
});

// Insert an expense for every due period of each template (catching up missed
// periods, capped to avoid runaway), then advance each schedule.
async function materializeRows(
  ctx: GenericMutationCtx<DataModel>,
  rows: Doc<"recurringExpenses">[],
  today: string,
) {
  const now = Date.now();
  for (const r of rows) {
    let dueDate = r.nextDueDate;
    let created = 0;
    while (dueDate <= today && created < 60) {
      await ctx.db.insert("expenses", {
        userId: r.userId,
        expenseType: r.expenseType,
        amountMinor: r.amountMinor,
        date: dueDate,
        vehicleId: r.vehicleId,
        notes: r.notes,
        createdAt: now,
        updatedAt: now,
      });
      dueDate = advance(dueDate, r.cadence);
      created++;
    }
    await ctx.db.patch(r._id, { nextDueDate: dueDate, updatedAt: now });
  }
}

// Cron target: materialize due templates across all users (uses the
// active+date index for an efficient scan).
export const materializeDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date(Date.now()).toISOString().slice(0, 10);
    const due = await ctx.db
      .query("recurringExpenses")
      .withIndex("by_active_due", (q) =>
        q.eq("active", true).lte("nextDueDate", today),
      )
      .collect();
    await materializeRows(ctx, due, today);
  },
});

// Called on app load so a user's due recurring expenses appear immediately,
// without waiting for the daily cron. Scoped to the signed-in user.
export const materializeMine = authedMutationV({
  args: {},
  handler: async (ctx) => {
    const today = new Date(Date.now()).toISOString().slice(0, 10);
    const rows = (
      await ctx.db
        .query("recurringExpenses")
        .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
        .collect()
    ).filter((r) => r.active && r.nextDueDate <= today);
    await materializeRows(ctx, rows, today);
  },
});
