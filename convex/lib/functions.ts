import type { GenericCtx } from "@convex-dev/better-auth";
import {
  customCtx,
  customMutation,
  customQuery,
  NoOp,
} from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod";
import type { DataModel } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireAuthedUserId } from "./owner";

// Shared modifier: enforce sign-in and inject `ctx.userId`.
const injectUser = customCtx(async (ctx: GenericCtx<DataModel>) => ({
  userId: await requireAuthedUserId(ctx),
}));

// Public, Zod-validated function builders.
export const zQuery = zCustomQuery(query, NoOp);
export const zMutation = zCustomMutation(mutation, NoOp);

// Authenticated, Zod-validated builders (ctx.userId injected).
export const authedQuery = zCustomQuery(query, injectUser);
export const authedMutation = zCustomMutation(mutation, injectUser);

// Authenticated builders using Convex `v` validators (for reusing the shared
// literal-union validators instead of Zod enums).
export const authedQueryV = customQuery(query, injectUser);
export const authedMutationV = customMutation(mutation, injectUser);
