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
import type * as chargingVendors from "../chargingVendors.js";
import type * as dashboard from "../dashboard.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as income from "../income.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_functions from "../lib/functions.js";
import type * as lib_owner from "../lib/owner.js";
import type * as odometers from "../odometers.js";
import type * as profiles from "../profiles.js";
import type * as shifts from "../shifts.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chargingVendors: typeof chargingVendors;
  dashboard: typeof dashboard;
  expenses: typeof expenses;
  http: typeof http;
  income: typeof income;
  "lib/constants": typeof lib_constants;
  "lib/errors": typeof lib_errors;
  "lib/functions": typeof lib_functions;
  "lib/owner": typeof lib_owner;
  odometers: typeof odometers;
  profiles: typeof profiles;
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
