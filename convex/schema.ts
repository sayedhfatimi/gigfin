import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  budgetPeriodValidator,
  expenseTypeValidator,
  goalPeriodValidator,
  goalTypeValidator,
  odometerUnitValidator,
  recurringCadenceValidator,
  taxJurisdictionValidator,
  unitRateUnitValidator,
  unitSystemValidator,
  vehicleTypeValidator,
  volumeUnitValidator,
} from "./lib/constants";

// Conventions:
// - `userId` is the Better Auth user id (string), keyed via the auth component.
// - All money is integer minor units (pence/cents).
// - All calendar dates are ISO `YYYY-MM-DD` strings.
// - Auth tables (user/session/account/twoFactor) live in the betterAuth component,
//   NOT here.
export default defineSchema({
  // App-specific user settings (auth identity is in the betterAuth component).
  profiles: defineTable({
    userId: v.string(),
    currency: v.string(), // ISO 4217, e.g. "GBP"
    unitSystem: unitSystemValidator,
    volumeUnit: volumeUnitValidator,
    odometerUnit: odometerUnitValidator,
    taxJurisdiction: taxJurisdictionValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  income: defineTable({
    userId: v.string(),
    platform: v.string(),
    amountMinor: v.number(),
    date: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_platform", ["userId", "platform"]),

  expenses: defineTable({
    userId: v.string(),
    expenseType: expenseTypeValidator,
    amountMinor: v.number(),
    date: v.string(),
    vehicleId: v.optional(v.id("vehicles")),
    notes: v.optional(v.string()),
    unitRateMinor: v.optional(v.number()),
    unitRateUnit: v.optional(unitRateUnitValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_type", ["userId", "expenseType"])
    .index("by_vehicle_date", ["vehicleId", "date"]),

  vehicles: defineTable({
    userId: v.string(),
    label: v.string(),
    vehicleType: vehicleTypeValidator,
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  odometers: defineTable({
    userId: v.string(),
    date: v.string(),
    startReading: v.number(),
    endReading: v.number(),
    vehicleId: v.optional(v.id("vehicles")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_vehicle_date", ["vehicleId", "date"]),

  chargingVendors: defineTable({
    userId: v.string(),
    label: v.string(),
    unitRateMinor: v.number(),
    unitRateUnit: unitRateUnitValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // --- Expanded vision ---

  shifts: defineTable({
    userId: v.string(),
    date: v.string(),
    startMinutes: v.number(), // minutes from local midnight
    endMinutes: v.number(),
    durationMin: v.number(),
    platform: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  goals: defineTable({
    userId: v.string(),
    type: goalTypeValidator,
    period: goalPeriodValidator,
    targetMinor: v.number(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  budgets: defineTable({
    userId: v.string(),
    expenseType: v.optional(expenseTypeValidator), // absent = overall budget
    period: budgetPeriodValidator,
    limitMinor: v.number(),
    alertThresholdPct: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  recurringExpenses: defineTable({
    userId: v.string(),
    expenseType: expenseTypeValidator,
    amountMinor: v.number(),
    cadence: recurringCadenceValidator,
    nextDueDate: v.string(),
    vehicleId: v.optional(v.id("vehicles")),
    notes: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_active_due", ["active", "nextDueDate"]),

  receipts: defineTable({
    userId: v.string(),
    expenseId: v.optional(v.id("expenses")),
    storageId: v.id("_storage"),
    mime: v.string(),
    uploadedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_expense", ["expenseId"]),

  // Custom offline account recovery: hashed one-time codes that authorize a
  // password reset without email.
  recoveryCodes: defineTable({
    userId: v.string(),
    codeHash: v.string(),
    used: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
