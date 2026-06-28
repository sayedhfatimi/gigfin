/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as budgets from "../budgets.js";
import type * as chargingVendors from "../chargingVendors.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as dashboardLayout from "../dashboardLayout.js";
import type * as data from "../data.js";
import type * as expenses from "../expenses.js";
import type * as goals from "../goals.js";
import type * as http from "../http.js";
import type * as income from "../income.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_functions from "../lib/functions.js";
import type * as lib_owner from "../lib/owner.js";
import type * as lib_period from "../lib/period.js";
import type * as lib_recurring from "../lib/recurring.js";
import type * as migrate from "../migrate.js";
import type * as odometers from "../odometers.js";
import type * as profiles from "../profiles.js";
import type * as receipts from "../receipts.js";
import type * as recurring from "../recurring.js";
import type * as recurringIncome from "../recurringIncome.js";
import type * as shifts from "../shifts.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  budgets: typeof budgets;
  chargingVendors: typeof chargingVendors;
  crons: typeof crons;
  dashboard: typeof dashboard;
  dashboardLayout: typeof dashboardLayout;
  data: typeof data;
  expenses: typeof expenses;
  goals: typeof goals;
  http: typeof http;
  income: typeof income;
  "lib/constants": typeof lib_constants;
  "lib/errors": typeof lib_errors;
  "lib/functions": typeof lib_functions;
  "lib/owner": typeof lib_owner;
  "lib/period": typeof lib_period;
  "lib/recurring": typeof lib_recurring;
  migrate: typeof migrate;
  odometers: typeof odometers;
  profiles: typeof profiles;
  receipts: typeof receipts;
  recurring: typeof recurring;
  recurringIncome: typeof recurringIncome;
  shifts: typeof shifts;
  vehicles: typeof vehicles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
