import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "../_generated/dataModel";
import { authComponent } from "../auth";
import { appError, ERROR_CODES } from "./errors";

// Returns the current Better Auth user id, or null if unauthenticated.
export async function getAuthedUserId(
  ctx: GenericCtx<DataModel>,
): Promise<string | null> {
  const user = await authComponent.safeGetAuthUser(ctx);
  return user ? (user._id as unknown as string) : null;
}

// Enforces authentication and returns the user id.
export async function requireAuthedUserId(
  ctx: GenericCtx<DataModel>,
): Promise<string> {
  const userId = await getAuthedUserId(ctx);
  if (!userId) {
    throw appError(ERROR_CODES.UNAUTHENTICATED, "Sign in required.");
  }
  return userId;
}

// Asserts a fetched document exists and belongs to `userId`. Returns it narrowed.
export function requireOwner<T extends { userId: string }>(
  userId: string,
  doc: T | null,
): T {
  if (!doc) {
    throw appError(ERROR_CODES.NOT_FOUND, "Not found.");
  }
  if (doc.userId !== userId) {
    throw appError(ERROR_CODES.FORBIDDEN, "You don't have access to this.");
  }
  return doc;
}
