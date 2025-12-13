#!/bin/sh
set -euo pipefail

mkdir -p /app/data
npx drizzle-kit migrate

exec "$@"
