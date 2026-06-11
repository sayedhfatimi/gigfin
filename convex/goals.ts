import { v } from "convex/values";
import { z } from "zod";
import { goalPeriodValidator, goalTypeValidator } from "./lib/constants";
import { authedMutationV, authedQuery } from "./lib/functions";
import { requireOwner } from "./lib/owner";
import { periodStart } from "./lib/period";

const sum = <T>(rows: T[], pick: (r: T) => number) =>
  rows.reduce((a, r) => a + pick(r), 0);

export const add = authedMutationV({
  args: {
    type: goalTypeValidator,
    period: goalPeriodValidator,
    targetMinor: v.number(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("goals", {
      userId: ctx.userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = authedMutationV({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.delete(args.id);
  },
});

// Goals with period-to-date progress (income, or net for savings goals).
export const withProgress = authedQuery({
  args: { today: z.string() },
  handler: async (ctx, { today }) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();
    if (goals.length === 0) return [];

    const [incomes, expenses] = await Promise.all([
      ctx.db
        .query("income")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .collect(),
      ctx.db
        .query("expenses")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .collect(),
    ]);

    return goals.map((g) => {
      const start = periodStart(g.period, today, g.startDate);
      const end = g.period === "custom" ? (g.endDate ?? today) : today;
      const within = (d: string) => d >= start && d <= end;
      const incomeMinor = sum(
        incomes.filter((i) => within(i.date)),
        (i) => i.amountMinor,
      );
      const progressMinor =
        g.type === "savings"
          ? incomeMinor -
            sum(
              expenses.filter((e) => within(e.date)),
              (e) => e.amountMinor,
            )
          : incomeMinor;
      return {
        _id: g._id,
        type: g.type,
        period: g.period,
        targetMinor: g.targetMinor,
        progressMinor,
        periodStart: start,
      };
    });
  },
});
