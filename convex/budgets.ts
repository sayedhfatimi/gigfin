import { v } from "convex/values";
import { z } from "zod";
import { budgetPeriodValidator, expenseTypeValidator } from "./lib/constants";
import { authedMutationV, authedQuery } from "./lib/functions";
import { requireOwner } from "./lib/owner";
import { periodStart } from "./lib/period";

const sum = <T>(rows: T[], pick: (r: T) => number) =>
  rows.reduce((a, r) => a + pick(r), 0);

export const add = authedMutationV({
  args: {
    expenseType: v.optional(expenseTypeValidator),
    period: budgetPeriodValidator,
    limitMinor: v.number(),
    alertThresholdPct: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("budgets", {
      userId: ctx.userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = authedMutationV({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.delete(args.id);
  },
});

// Budgets with period-to-date spend (overall, or for one category).
export const withProgress = authedQuery({
  args: { today: z.string() },
  handler: async (ctx, { today }) => {
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();
    if (budgets.length === 0) return [];

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
      .collect();

    return budgets.map((b) => {
      const start = periodStart(b.period, today);
      const spentMinor = sum(
        expenses.filter(
          (e) =>
            e.date >= start &&
            e.date <= today &&
            (!b.expenseType || e.expenseType === b.expenseType),
        ),
        (e) => e.amountMinor,
      );
      return {
        _id: b._id,
        expenseType: b.expenseType,
        period: b.period,
        limitMinor: b.limitMinor,
        spentMinor,
      };
    });
  },
});
