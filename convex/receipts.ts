import { v } from "convex/values";
import { authedMutationV, authedQueryV } from "./lib/functions";
import { requireOwner } from "./lib/owner";

// Receipts use the self-hosted Convex file storage (local, no S3 / cloud).

export const generateUploadUrl = authedMutationV({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const attach = authedMutationV({
  args: {
    expenseId: v.id("expenses"),
    storageId: v.id("_storage"),
    mime: v.string(),
  },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.expenseId));
    return ctx.db.insert("receipts", {
      userId: ctx.userId,
      expenseId: args.expenseId,
      storageId: args.storageId,
      mime: args.mime,
      uploadedAt: Date.now(),
    });
  },
});

export const getForExpense = authedQueryV({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    requireOwner(ctx.userId, await ctx.db.get(args.expenseId));
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_expense", (q) => q.eq("expenseId", args.expenseId))
      .collect();
    return Promise.all(
      receipts.map(async (r) => ({
        _id: r._id,
        mime: r.mime,
        url: await ctx.storage.getUrl(r.storageId),
      })),
    );
  },
});

export const remove = authedMutationV({
  args: { id: v.id("receipts") },
  handler: async (ctx, args) => {
    const receipt = requireOwner(ctx.userId, await ctx.db.get(args.id));
    await ctx.storage.delete(receipt.storageId);
    await ctx.db.delete(args.id);
  },
});
