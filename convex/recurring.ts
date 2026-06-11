import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
  expenseTypeValidator,
  recurringCadenceValidator,
} from "./lib/constants";
import { authedMutationV, authedQueryV } from "./lib/functions";
import { requireOwner } from "./lib/owner";

const fields = {
  expenseType: expenseTypeValidator,
  amountMinor: v.number(),
  cadence: recurringCadenceValidator,
  nextDueDate: v.string(),
  vehicleId: v.optional(v.id("vehicles")),
  notes: v.optional(v.string()),
};

// Advance an ISO date by one cadence period (UTC).
function advance(dateStr: string, cadence: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (cadence === "weekly") dt.setUTCDate(dt.getUTCDate() + 7);
  else if (cadence === "biweekly") dt.setUTCDate(dt.getUTCDate() + 14);
  else if (cadence === "monthly") dt.setUTCMonth(dt.getUTCMonth() + 1);
  else if (cadence === "quarterly") dt.setUTCMonth(dt.getUTCMonth() + 3);
  else if (cadence === "yearly") dt.setUTCFullYear(dt.getUTCFullYear() + 1);
  return dt.toISOString().slice(0, 10);
}

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

// Cron target: materialize every active recurring template whose next due date
// has arrived (catching up any missed periods), then advance the schedule.
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

    const now = Date.now();
    for (const r of due) {
      let dueDate = r.nextDueDate;
      let created = 0;
      // Cap catch-up to avoid runaway for very stale templates.
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
  },
});
