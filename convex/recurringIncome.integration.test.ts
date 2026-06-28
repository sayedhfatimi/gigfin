// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { Doc } from "./_generated/dataModel";
import { materializeRows } from "./recurringIncome";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function seedTemplate(
  // biome-ignore lint/suspicious/noExplicitAny: convex-test run ctx
  ctx: any,
  over: Partial<Doc<"recurringIncome">> = {},
): Promise<Doc<"recurringIncome">> {
  const id = await ctx.db.insert("recurringIncome", {
    userId: "user_1",
    platform: "Uber",
    amountMinor: 5000,
    cadence: "monthly",
    nextDueDate: "2026-01-15",
    active: true,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  });
  return ctx.db.get(id);
}

describe("recurringIncome.materializeRows", () => {
  it("inserts one income row per due period and advances past today", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const tpl = await seedTemplate(ctx, { nextDueDate: "2026-01-15" });
      await materializeRows(ctx, [tpl], "2026-04-15");
    });

    const income = await t.run(async (ctx) =>
      ctx.db
        .query("income")
        .withIndex("by_user_date", (q) => q.eq("userId", "user_1"))
        .collect(),
    );
    expect(income.map((i) => i.date).sort()).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
    ]);
    expect(
      income.every((i) => i.platform === "Uber" && i.amountMinor === 5000),
    ).toBe(true);

    const tpl = await t.run(async (ctx) =>
      ctx.db
        .query("recurringIncome")
        .withIndex("by_user", (q) => q.eq("userId", "user_1"))
        .first(),
    );
    expect(tpl?.nextDueDate).toBe("2026-05-15");
  });

  it("caps catch-up at 60 insertions for a long-stale schedule", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const tpl = await seedTemplate(ctx, {
        nextDueDate: "2020-01-01",
        cadence: "weekly",
      });
      await materializeRows(ctx, [tpl], "2026-04-15");
    });

    const income = await t.run(async (ctx) =>
      ctx.db
        .query("income")
        .withIndex("by_user_date", (q) => q.eq("userId", "user_1"))
        .collect(),
    );
    expect(income).toHaveLength(60);
  });
});
