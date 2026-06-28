// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { Doc } from "./_generated/dataModel";
import { materializeRows } from "./recurring";
import schema from "./schema";

// convex-test needs the module map for this convex dir.
const modules = import.meta.glob("./**/*.ts");

// Build an in-db recurringExpenses template and return its doc.
async function seedTemplate(
  // biome-ignore lint/suspicious/noExplicitAny: convex-test run ctx
  ctx: any,
  over: Partial<Doc<"recurringExpenses">> = {},
): Promise<Doc<"recurringExpenses">> {
  const id = await ctx.db.insert("recurringExpenses", {
    userId: "user_1",
    expenseType: "insurance",
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

describe("convex-test harness", () => {
  it("initializes and round-trips a row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const tpl = await seedTemplate(ctx);
      expect(tpl).not.toBeNull();
    });
  });
});

describe("materializeRows", () => {
  it("inserts one expense per due period up to and including today, then advances", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const tpl = await seedTemplate(ctx, { nextDueDate: "2026-01-15" });
      await materializeRows(ctx, [tpl], "2026-04-15");
    });

    const expenses = await t.run(async (ctx) =>
      ctx.db
        .query("expenses")
        .withIndex("by_user_date", (q) => q.eq("userId", "user_1"))
        .collect(),
    );
    // Jan 15, Feb 15, Mar 15, Apr 15 — four due periods.
    expect(expenses.map((e) => e.date).sort()).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
    ]);

    const tpl = await t.run(async (ctx) =>
      ctx.db
        .query("recurringExpenses")
        .withIndex("by_user", (q) => q.eq("userId", "user_1"))
        .first(),
    );
    // Advanced past today.
    expect(tpl?.nextDueDate).toBe("2026-05-15");
  });

  it("copies template fields onto each materialized expense", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const tpl = await seedTemplate(ctx, {
        nextDueDate: "2026-04-15",
        expenseType: "phone",
        amountMinor: 1299,
        notes: "monthly plan",
      });
      await materializeRows(ctx, [tpl], "2026-04-15");
    });

    const [exp] = await t.run(async (ctx) =>
      ctx.db
        .query("expenses")
        .withIndex("by_user_date", (q) => q.eq("userId", "user_1"))
        .collect(),
    );
    expect(exp).toMatchObject({
      userId: "user_1",
      expenseType: "phone",
      amountMinor: 1299,
      date: "2026-04-15",
      notes: "monthly plan",
    });
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

    const expenses = await t.run(async (ctx) =>
      ctx.db
        .query("expenses")
        .withIndex("by_user_date", (q) => q.eq("userId", "user_1"))
        .collect(),
    );
    expect(expenses).toHaveLength(60);

    // Capped before catching up — next due date is still well before today.
    const tpl = await t.run(async (ctx) =>
      ctx.db
        .query("recurringExpenses")
        .withIndex("by_user", (q) => q.eq("userId", "user_1"))
        .first(),
    );
    expect(tpl !== null && tpl.nextDueDate < "2026-04-15").toBe(true);
  });
});
