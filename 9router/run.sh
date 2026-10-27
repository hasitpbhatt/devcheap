#!/usr/bin/env bash
# Replit Run-button entrypoint for 9router.
#   - serves the prebuilt production bundle when one exists
#   - falls back to `next dev` (Turbopack) on a fresh checkout
# Force dev mode with: NINEROUTER_DEV=1 bash 9router/run.sh
set -euo pipefail
cd "$(dirname "$0")"

# Next.js reads .env on its own, but the custom server and the port args below
# need these values before the app boots.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-20127}"
export DATA_DIR="${DATA_DIR:-$PWD/data}"
export NEXT_TELEMETRY_DISABLED=1
mkdir -p "$DATA_DIR"

# Replit provides the workspace's public dev hostname. Using it keeps OAuth
# callbacks and share links pointed at the externally reachable URL.
if [ -n "${REPLIT_DEV_DOMAIN:-}" ]; then
  export BASE_URL="${BASE_URL:-https://$REPLIT_DEV_DOMAIN}"
  export NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL:-https://$REPLIT_DEV_DOMAIN}"
fi

if [ -f .next/BUILD_ID ] && [ "${NINEROUTER_DEV:-0}" != "1" ]; then
  # A production bundle goes stale as soon as source files change. Detect that so
  # the Run button never serves yesterday's code; fall back to dev instead.
  stale="$(find src open-sse public next.config.mjs package.json custom-server.js \
    -newer .next/BUILD_ID -print -quit 2>/dev/null || true)"
  if [ -z "$stale" ]; then
    echo "[9router] production build found — listening on http://0.0.0.0:$PORT"
    exec node custom-server.js --port "$PORT"
  fi
  echo "[9router] production build is older than $stale — rebuilding is recommended"
fi

echo "[9router] no production build — starting dev server on http://0.0.0.0:$PORT"
exec ./node_modules/.bin/next dev -H 0.0.0.0 -p "$PORT"
