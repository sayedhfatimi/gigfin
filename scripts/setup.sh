#!/bin/sh
# One-time GigFin setup: generate the three required secrets.
#
#   - BETTER_AUTH_SECRET          (session signing)
#   - CONVEX_INSTANCE_SECRET      (pins the backend instance so the admin key is stable)
#   - CONVEX_SELF_HOSTED_ADMIN_KEY (lets the app deploy Convex functions on first boot)
#
# Pinning the instance secret means the admin key never changes, so the deploy →
# generate-key → redeploy dance is gone: set these once and every future deploy
# just works.
#
# Usage:
#   sh scripts/setup.sh
#
#   - If .env is missing, it is created from .env.example with the three values filled.
#   - If .env already exists, the values are only printed (nothing is overwritten) —
#     paste them into your env (e.g. Coolify's environment UI).
#
# Requires: docker, openssl. NOTE: use a FRESH `gigfin-convex-data` volume — a pinned
# secret that differs from an already-initialised volume's secret will not match.

set -e

INSTANCE_NAME="${CONVEX_INSTANCE_NAME:-gigfin}"
BACKEND_IMAGE="${CONVEX_BACKEND_IMAGE:-ghcr.io/get-convex/convex-backend:latest}"

for bin in docker openssl; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "error: '$bin' is required but not found in PATH" >&2
    exit 1
  fi
done

echo "[setup] Generating secrets..."
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
CONVEX_INSTANCE_SECRET="$(openssl rand -hex 32)"

echo "[setup] Minting an admin key for the pinned instance secret..."
# generate_admin_key.sh mints a fresh signed key each run; any key minted with a
# given INSTANCE_SECRET stays valid against a backend running that same secret. So
# we mint one here in a throwaway container (no server boot, no data volume needed)
# and it remains valid for every future deploy — no redeploy dance.
ADMIN_KEY="$(
  docker run --rm \
    -e INSTANCE_NAME="$INSTANCE_NAME" \
    -e INSTANCE_SECRET="$CONVEX_INSTANCE_SECRET" \
    --entrypoint ./generate_admin_key.sh \
    "$BACKEND_IMAGE" 2>/dev/null \
    | tr -d '\r' | grep -E "^${INSTANCE_NAME}\|" | tail -n1
)"

if [ -z "$ADMIN_KEY" ]; then
  echo "error: failed to generate the admin key (empty output from generate_admin_key.sh)." >&2
  echo "       Check that '$BACKEND_IMAGE' is pullable, then re-run." >&2
  exit 1
fi

print_values() {
  echo "BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET"
  echo "CONVEX_INSTANCE_SECRET=$CONVEX_INSTANCE_SECRET"
  echo "CONVEX_SELF_HOSTED_ADMIN_KEY=$ADMIN_KEY"
}

if [ -f .env ]; then
  echo
  echo "[setup] .env already exists — not overwriting. Add/replace these three lines"
  echo "        (or paste them into your host's environment, e.g. Coolify):"
  echo
  print_values
else
  if [ ! -f .env.example ]; then
    echo "error: .env.example not found (run from the repo root)." >&2
    exit 1
  fi
  # Write the secrets via a restrictively-created temp file (umask 077 → mode 600),
  # then move into place, so .env is never momentarily world-readable.
  (
    umask 077
    awk \
      -v ba="$BETTER_AUTH_SECRET" \
      -v isec="$CONVEX_INSTANCE_SECRET" \
      -v ak="$ADMIN_KEY" '
      /^BETTER_AUTH_SECRET=/          { print "BETTER_AUTH_SECRET=" ba; next }
      /^CONVEX_INSTANCE_SECRET=/      { print "CONVEX_INSTANCE_SECRET=" isec; next }
      /^CONVEX_SELF_HOSTED_ADMIN_KEY=/{ print "CONVEX_SELF_HOSTED_ADMIN_KEY=" ak; next }
      { print }
    ' .env.example > .env.tmp
  ) && mv .env.tmp .env
  echo
  echo "[setup] Wrote .env (mode 600) with the generated secrets."
  echo "        Review CONVEX_PUBLIC_URL and SITE_URL for your deployment (local"
  echo "        defaults are already set), then: docker compose up -d"
fi

echo
echo "[setup] Done. Reminder: deploy onto a FRESH 'gigfin-convex-data' volume so the"
echo "        pinned instance secret matches."
