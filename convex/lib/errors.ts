import { ConvexError } from "convex/values";

// User-facing failures carry a stable code + message via ConvexError.
// Programmer errors should use plain `throw new Error(...)`.
export const ERROR_CODES = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  FEATURE_DISABLED: "FEATURE_DISABLED",
  SIGNUP_DISABLED: "SIGNUP_DISABLED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export function appError(code: ErrorCode, message: string) {
  return new ConvexError({ code, message });
}
