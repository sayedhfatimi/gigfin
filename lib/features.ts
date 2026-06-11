/**
 * Air-gap feature gating. Every optional outward integration is OFF unless its
 * env vars are present. This module is the single source of truth for "is X
 * available?" — UI hides/disables absent features; the backend mirrors the same
 * checks (via Convex env) before doing any network work.
 *
 * Server-only flags read private env. `publicFeatures()` returns the subset that
 * is safe to send to the browser (and is also derivable from NEXT_PUBLIC_* vars).
 */

export const serverFeatures = {
  // Email (password reset / verification) via the Resend Convex component.
  email: Boolean(process.env.RESEND_API_KEY),
  // Privacy-friendly analytics (Rybbit / Plausible / Umami).
  analytics: Boolean(
    process.env.ANALYTICS_SCRIPT_URL && process.env.ANALYTICS_SITE_ID,
  ),
  // Self-serve registration; operators can lock an instance to existing users.
  signupEnabled: process.env.GIGFIN_DISABLE_SIGNUP !== "true",
} as const;

export type PublicFeatures = {
  email: boolean;
  signupEnabled: boolean;
};

export function publicFeatures(): PublicFeatures {
  return {
    email: serverFeatures.email,
    signupEnabled: serverFeatures.signupEnabled,
  };
}
