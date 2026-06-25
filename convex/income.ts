import { zid } from "convex-helpers/server/zod";
import { incomeFields } from "../lib/schemas/income";
import { authedMutation, authedQuery } from "./lib/functions";
import { requireOwner } from "./lib/owner";

export const list = authedQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query("income")
      .withIndex("by_user_date", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .collect(),
});

export const add = authedMutation({
  args: incomeFields,
  handler: async (ctx, args) =>
    ctx.db.insert("income", {
      userId: ctx.userId,
      platform: args.platform,
      amountMinor: args.amountMinor,
      date: args.date,
      createdAt: Date.now(),
    }),
});

export const update = authedMutation({
  args: { id: zid("income"), ...incomeFields },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.patch(args.id, {
      platform: args.platform,
      amountMinor: args.amountMinor,
      date: args.date,
    });
  },
});

export const remove = authedMutation({
  args: { id: zid("income") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.db.delete(args.id);
  },
});
