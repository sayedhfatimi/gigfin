// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { applyImport } from "./migrate";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const sampleData = {
  vehicles: [
    {
      oldId: "v1",
      label: "My Car",
      vehicleType: "EV" as const,
      isDefault: true,
    },
  ],
  income: [{ platform: "Uber", amountMinor: 12000, date: "2026-01-10" }],
  expenses: [
    // references the imported vehicle by its old id
    {
      expenseType: "insurance" as const,
      amountMinor: 5000,
      date: "2026-01-05",
      oldVehicleId: "v1",
    },
    // references a vehicle id NOT present in data.vehicles (orphan)
    {
      expenseType: "parking" as const,
      amountMinor: 200,
      date: "2026-01-06",
      oldVehicleId: "ghost",
    },
  ],
  odometers: [
    {
      date: "2026-01-07",
      startReading: 1000,
      endReading: 1100,
      oldVehicleId: "v1",
    },
  ],
  charging: [
    {
      label: "OVO Home",
      unitRateMinor: 750,
      unitRateUnit: "kwh" as const,
    },
  ],
};

describe("applyImport", () => {
  it("returns counts matching the input", async () => {
    const t = convexTest(schema, modules);
    const counts = await t.run(async (ctx) =>
      applyImport(ctx, "user_1", sampleData),
    );
    expect(counts).toEqual({
      vehicles: 1,
      income: 1,
      expenses: 2,
      odometers: 1,
      charging: 1,
    });
  });

  it("remaps old vehicle ids to the newly inserted vehicle", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => applyImport(ctx, "user_1", sampleData));

    const [vehicle] = await t.run(async (ctx) =>
      ctx.db
        .query("vehicles")
        .withIndex("by_user", (q) => q.eq("userId", "user_1"))
        .collect(),
    );
    const expenses = await t.run(async (ctx) =>
      ctx.db
        .query("expenses")
        .withIndex("by_user_date", (q) => q.eq("userId", "user_1"))
        .collect(),
    );
    const linked = expenses.find((e) => e.expenseType === "insurance");
    const orphan = expenses.find((e) => e.expenseType === "parking");

    // Linked expense points at the real new vehicle id.
    expect(linked?.vehicleId).toBe(vehicle._id);
    // Orphan reference (not in data.vehicles) resolves to undefined — documents
    // the current silent-drop behaviour this test exists to pin.
    expect(orphan?.vehicleId).toBeUndefined();
  });

  it("keys every inserted row to the target user", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => applyImport(ctx, "user_1", sampleData));

    const allUserIds = await t.run(async (ctx) => {
      const income = await ctx.db.query("income").collect();
      const expenses = await ctx.db.query("expenses").collect();
      const odometers = await ctx.db.query("odometers").collect();
      const charging = await ctx.db.query("chargingVendors").collect();
      return [...income, ...expenses, ...odometers, ...charging].map(
        (r) => r.userId,
      );
    });
    expect(allUserIds.every((id) => id === "user_1")).toBe(true);
  });
});
