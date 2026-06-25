import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { twoFactor } from "better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

// Operators can lock an instance to existing users. Enforced here at the auth
// layer (not just hidden in the UI) so the sign-up endpoint itself is closed.
// NOTE: this is read from the *Convex backend* env — docker-entrypoint.sh must
// push GIGFIN_DISABLE_SIGNUP via `convex env set`, like the other backend vars.
const disableSignUp = process.env.GIGFIN_DISABLE_SIGNUP === "true";

// Component client: bridges Convex <-> Better Auth and exposes helpers.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Air-gap friendly: email/password works with no email provider.
    // Verification + password-reset-by-email are layered on only when Resend
    // is configured (see lib/features.ts). Offline recovery is a custom flow.
    emailAndPassword: {
      enabled: true,
      disableSignUp,
      requireEmailVerification: false,
    },
    plugins: [
      // TOTP two-factor (supported by the default component schema).
      twoFactor(),
      // Required for Convex compatibility — keep last.
      convex({ authConfig }),
    ],
  });

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => authComponent.getAuthUser(ctx),
});
