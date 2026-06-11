import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation } from "./_generated/server";
import {
  type ExpenseType,
  expenseTypeValidator,
  type UnitRateUnit,
  unitRateUnitValidator,
  type VehicleType,
  vehicleTypeValidator,
} from "./lib/constants";
import { authedMutationV } from "./lib/functions";

type ImportData = {
  vehicles: {
    oldId: string;
    label: string;
    vehicleType: VehicleType;
    isDefault: boolean;
  }[];
  income: { platform: string; amountMinor: number; date: string }[];
  expenses: {
    expenseType: ExpenseType;
    amountMinor: number;
    date: string;
    oldVehicleId?: string;
    notes?: string;
    unitRateMinor?: number;
    unitRateUnit?: UnitRateUnit;
  }[];
  odometers: {
    date: string;
    startReading: number;
    endReading: number;
    oldVehicleId?: string;
    notes?: string;
  }[];
  charging: {
    label: string;
    unitRateMinor: number;
    unitRateUnit: UnitRateUnit;
  }[];
};

// Shared import: insert vehicles first, remap old vehicle ids on dependent rows.
async function applyImport(ctx: MutationCtx, userId: string, data: ImportData) {
  const now = Date.now();
  const vmap = new Map<string, Id<"vehicles">>();

  for (const vh of data.vehicles) {
    const id = await ctx.db.insert("vehicles", {
      userId,
      label: vh.label,
      vehicleType: vh.vehicleType,
      isDefault: vh.isDefault,
      createdAt: now,
      updatedAt: now,
    });
    vmap.set(vh.oldId, id);
  }

  for (const i of data.income) {
    await ctx.db.insert("income", {
      userId,
      platform: i.platform,
      amountMinor: i.amountMinor,
      date: i.date,
      createdAt: now,
    });
  }

  for (const e of data.expenses) {
    await ctx.db.insert("expenses", {
      userId,
      expenseType: e.expenseType,
      amountMinor: e.amountMinor,
      date: e.date,
      vehicleId: e.oldVehicleId ? vmap.get(e.oldVehicleId) : undefined,
      notes: e.notes,
      unitRateMinor: e.unitRateMinor,
      unitRateUnit: e.unitRateUnit,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const o of data.odometers) {
    await ctx.db.insert("odometers", {
      userId,
      date: o.date,
      startReading: o.startReading,
      endReading: o.endReading,
      vehicleId: o.oldVehicleId ? vmap.get(o.oldVehicleId) : undefined,
      notes: o.notes,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const c of data.charging) {
    await ctx.db.insert("chargingVendors", {
      userId,
      label: c.label,
      unitRateMinor: c.unitRateMinor,
      unitRateUnit: c.unitRateUnit,
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    vehicles: data.vehicles.length,
    income: data.income.length,
    expenses: data.expenses.length,
    odometers: data.odometers.length,
    charging: data.charging.length,
  };
}

const vehiclesArg = v.array(
  v.object({
    oldId: v.string(),
    label: v.string(),
    vehicleType: vehicleTypeValidator,
    isDefault: v.boolean(),
  }),
);
const incomeArg = v.array(
  v.object({ platform: v.string(), amountMinor: v.number(), date: v.string() }),
);
const expensesArg = v.array(
  v.object({
    expenseType: expenseTypeValidator,
    amountMinor: v.number(),
    date: v.string(),
    oldVehicleId: v.optional(v.string()),
    notes: v.optional(v.string()),
    unitRateMinor: v.optional(v.number()),
    unitRateUnit: v.optional(unitRateUnitValidator),
  }),
);
const odometersArg = v.array(
  v.object({
    date: v.string(),
    startReading: v.number(),
    endReading: v.number(),
    oldVehicleId: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),
);
const chargingArg = v.array(
  v.object({
    label: v.string(),
    unitRateMinor: v.number(),
    unitRateUnit: unitRateUnitValidator,
  }),
);

// In-app import for the signed-in user (used by the "Migrate from GigFin v1"
// dialog). No secret — data is keyed to the authenticated user.
export const importMine = authedMutationV({
  args: {
    vehicles: vehiclesArg,
    income: incomeArg,
    expenses: expensesArg,
    odometers: odometersArg,
    charging: chargingArg,
  },
  handler: (ctx, args) => applyImport(ctx, ctx.userId, args),
});

// CLI import (scripts/migrate-sqlite.ts) for an explicit user id, guarded by
// MIGRATION_SECRET. Remove / rotate the secret after migrating.
export const importForUser = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    vehicles: vehiclesArg,
    income: incomeArg,
    expenses: expensesArg,
    odometers: odometersArg,
    charging: chargingArg,
  },
  handler: async (ctx, args) => {
    const expected = process.env.MIGRATION_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Invalid or unset MIGRATION_SECRET");
    }
    return applyImport(ctx, args.userId, args);
  },
});
