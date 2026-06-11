import { v } from "convex/values";
import { expenseTypeValidator } from "./lib/constants";
import { authedMutationV, authedQueryV } from "./lib/functions";

export const exportAll = authedQueryV({
  args: {},
  handler: async (ctx) => {
    const [income, expenses, odometers, shifts] = await Promise.all([
      ctx.db
        .query("income")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("expenses")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("odometers")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("shifts")
        .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
        .order("desc")
        .collect(),
    ]);
    return { income, expenses, odometers, shifts };
  },
});

export const importIncome = authedMutationV({
  args: {
    rows: v.array(
      v.object({
        date: v.string(),
        platform: v.string(),
        amountMinor: v.number(),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    const now = Date.now();
    for (const r of rows) {
      await ctx.db.insert("income", {
        userId: ctx.userId,
        platform: r.platform,
        amountMinor: r.amountMinor,
        date: r.date,
        createdAt: now,
      });
    }
    return rows.length;
  },
});

export const importExpenses = authedMutationV({
  args: {
    rows: v.array(
      v.object({
        date: v.string(),
        expenseType: expenseTypeValidator,
        amountMinor: v.number(),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    const now = Date.now();
    for (const r of rows) {
      await ctx.db.insert("expenses", {
        userId: ctx.userId,
        expenseType: r.expenseType,
        amountMinor: r.amountMinor,
        date: r.date,
        notes: r.notes,
        createdAt: now,
        updatedAt: now,
      });
    }
    return rows.length;
  },
});
