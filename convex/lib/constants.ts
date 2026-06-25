import { type Validator, v } from "convex/values";

// Single source of truth for enum-like domain values + their Convex validators.
// Mirror these in lib/schemas (Zod) so client forms and server args agree.

export const EXPENSE_TYPES = [
  "fuel_charging",
  "maintenance",
  "repairs",
  "tyres",
  "cleaning",
  "insurance",
  "road_tax",
  "mot",
  "parking",
  "tolls",
  "congestion",
  "phone",
  "equipment",
  "platform_fees",
  "fines",
  "finance",
  "depreciation",
] as const;

// HMRC-disallowed expenses (e.g. fines/penalties for breaking the law) — excluded
// from allowable expenses and from taxable profit.
export const NON_DEDUCTIBLE_EXPENSE_TYPES = ["fines"] as const;

// Vehicle running costs that the simplified mileage allowance replaces when the
// mileage method is chosen. Parking/tolls/congestion are claimable on top of
// mileage, so they are deliberately excluded; cleaning is kept separate too.
export const VEHICLE_COST_EXPENSE_TYPES = [
  "fuel_charging",
  "insurance",
  "tyres",
  "mot",
  "finance",
  "road_tax",
  "maintenance",
  "repairs",
  "depreciation",
] as const;

export const VEHICLE_TYPES = ["EV", "PETROL", "DIESEL", "HYBRID"] as const;
export const UNIT_RATE_UNITS = [
  "kwh",
  "litre",
  "gallon_us",
  "gallon_imp",
] as const;
export const TAX_JURISDICTIONS = ["UK", "US"] as const;
export const UNIT_SYSTEMS = ["metric", "imperial"] as const;
export const VOLUME_UNITS = ["litre", "gallon"] as const;
export const ODOMETER_UNITS = ["km", "mi"] as const;
export const GOAL_TYPES = ["income", "savings"] as const;
export const GOAL_PERIODS = ["weekly", "monthly", "custom"] as const;
export const BUDGET_PERIODS = ["weekly", "monthly"] as const;
export const RECURRING_CADENCES = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type ExpenseType = (typeof EXPENSE_TYPES)[number];
export type VehicleType = (typeof VEHICLE_TYPES)[number];
export type UnitRateUnit = (typeof UNIT_RATE_UNITS)[number];
export type TaxJurisdiction = (typeof TAX_JURISDICTIONS)[number];
export type RecurringCadence = (typeof RECURRING_CADENCES)[number];

// Build a Convex union-of-literals validator from a readonly string tuple,
// preserving the literal-union type (so document fields are typed as the union,
// not `never`).
const lit = <T extends string>(values: readonly T[]): Validator<T> =>
  v.union(
    ...(values.map((value) => v.literal(value)) as unknown as [
      Validator<T>,
      Validator<T>,
      ...Validator<T>[],
    ]),
  ) as unknown as Validator<T>;

export const expenseTypeValidator = lit(EXPENSE_TYPES);
export const vehicleTypeValidator = lit(VEHICLE_TYPES);
export const unitRateUnitValidator = lit(UNIT_RATE_UNITS);
export const taxJurisdictionValidator = lit(TAX_JURISDICTIONS);
export const unitSystemValidator = lit(UNIT_SYSTEMS);
export const volumeUnitValidator = lit(VOLUME_UNITS);
export const odometerUnitValidator = lit(ODOMETER_UNITS);
export const goalTypeValidator = lit(GOAL_TYPES);
export const goalPeriodValidator = lit(GOAL_PERIODS);
export const budgetPeriodValidator = lit(BUDGET_PERIODS);
export const recurringCadenceValidator = lit(RECURRING_CADENCES);
