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

export const importOdometers = authedMutationV({
  args: {
    rows: v.array(
      v.object({
        date: v.string(),
        startReading: v.number(),
        endReading: v.optional(v.number()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    const now = Date.now();
    let inserted = 0;
    for (const r of rows) {
      // Skip rows where a present end reading is below the start.
      if (r.endReading !== undefined && r.endReading < r.startReading) continue;
      await ctx.db.insert("odometers", {
        userId: ctx.userId,
        date: r.date,
        startReading: r.startReading,
        endReading: r.endReading,
        notes: r.notes,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }
    return inserted;
  },
});

export const importShifts = authedMutationV({
  args: {
    rows: v.array(
      v.object({
        date: v.string(),
        startMinutes: v.number(),
        endMinutes: v.optional(v.number()),
        platform: v.optional(v.string()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    const now = Date.now();
    for (const r of rows) {
      const durationMin =
        r.endMinutes !== undefined ? r.endMinutes - r.startMinutes : undefined;
      await ctx.db.insert("shifts", {
        userId: ctx.userId,
        date: r.date,
        startMinutes: r.startMinutes,
        endMinutes: r.endMinutes,
        durationMin,
        platform: r.platform,
        notes: r.notes,
        createdAt: now,
        updatedAt: now,
      });
    }
    return rows.length;
  },
});
