import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import {
  expenseTypeValidator,
  unitRateUnitValidator,
  vehicleTypeValidator,
} from "./lib/constants";

// One-time SQLite → Convex import, run by the operator via the migration script
// (`scripts/migrate-sqlite.ts`). Guarded by MIGRATION_SECRET (a backend env var)
// since it writes data for an explicit userId without a session. Remove / rotate
// the secret after migrating.
export const importForUser = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    vehicles: v.array(
      v.object({
        oldId: v.string(),
        label: v.string(),
        vehicleType: vehicleTypeValidator,
        isDefault: v.boolean(),
      }),
    ),
    income: v.array(
      v.object({
        platform: v.string(),
        amountMinor: v.number(),
        date: v.string(),
      }),
    ),
    expenses: v.array(
      v.object({
        expenseType: expenseTypeValidator,
        amountMinor: v.number(),
        date: v.string(),
        oldVehicleId: v.optional(v.string()),
        notes: v.optional(v.string()),
        unitRateMinor: v.optional(v.number()),
        unitRateUnit: v.optional(unitRateUnitValidator),
      }),
    ),
    odometers: v.array(
      v.object({
        date: v.string(),
        startReading: v.number(),
        endReading: v.number(),
        oldVehicleId: v.optional(v.string()),
        notes: v.optional(v.string()),
      }),
    ),
    charging: v.array(
      v.object({
        label: v.string(),
        unitRateMinor: v.number(),
        unitRateUnit: unitRateUnitValidator,
      }),
    ),
  },
  handler: async (ctx, args) => {
    const expected = process.env.MIGRATION_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Invalid or unset MIGRATION_SECRET");
    }

    const now = Date.now();
    const vmap = new Map<string, Id<"vehicles">>();

    for (const vh of args.vehicles) {
      const id = await ctx.db.insert("vehicles", {
        userId: args.userId,
        label: vh.label,
        vehicleType: vh.vehicleType,
        isDefault: vh.isDefault,
        createdAt: now,
        updatedAt: now,
      });
      vmap.set(vh.oldId, id);
    }

    for (const i of args.income) {
      await ctx.db.insert("income", {
        userId: args.userId,
        platform: i.platform,
        amountMinor: i.amountMinor,
        date: i.date,
        createdAt: now,
      });
    }

    for (const e of args.expenses) {
      const vehicleId = e.oldVehicleId ? vmap.get(e.oldVehicleId) : undefined;
      await ctx.db.insert("expenses", {
        userId: args.userId,
        expenseType: e.expenseType,
        amountMinor: e.amountMinor,
        date: e.date,
        vehicleId,
        notes: e.notes,
        unitRateMinor: e.unitRateMinor,
        unitRateUnit: e.unitRateUnit,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const o of args.odometers) {
      const vehicleId = o.oldVehicleId ? vmap.get(o.oldVehicleId) : undefined;
      await ctx.db.insert("odometers", {
        userId: args.userId,
        date: o.date,
        startReading: o.startReading,
        endReading: o.endReading,
        vehicleId,
        notes: o.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const c of args.charging) {
      await ctx.db.insert("chargingVendors", {
        userId: args.userId,
        label: c.label,
        unitRateMinor: c.unitRateMinor,
        unitRateUnit: c.unitRateUnit,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      vehicles: args.vehicles.length,
      income: args.income.length,
      expenses: args.expenses.length,
      odometers: args.odometers.length,
      charging: args.charging.length,
    };
  },
});
