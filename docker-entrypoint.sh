#!/bin/sh
set -e

# Push backend env + deploy Convex functions to the self-hosted backend, then
# start the app. Community pattern (not officially documented by Convex), kept
# isolated here. No-ops gracefully if the backend target isn't configured.
if [ -n "$CONVEX_SELF_HOSTED_URL" ] && [ -n "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
  echo "[gigfin] Configuring Convex backend and deploying functions..."
  [ -n "$BETTER_AUTH_SECRET" ] && bunx convex env set BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET" >/dev/null 2>&1 || true
  [ -n "$SITE_URL" ] && bunx convex env set SITE_URL "$SITE_URL" >/dev/null 2>&1 || true
  [ -n "$RESEND_API_KEY" ] && bunx convex env set RESEND_API_KEY "$RESEND_API_KEY" >/dev/null 2>&1 || true
  bunx convex deploy -y || echo "[gigfin] WARN: convex deploy failed — check backend health and admin key."
else
  echo "[gigfin] CONVEX_SELF_HOSTED_URL / ADMIN_KEY not set; skipping function deploy."
fi

exec bun run start
