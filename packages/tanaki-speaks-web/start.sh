#!/usr/bin/env bash
set -euo pipefail

export DEBUG_SERVER_PORT="${DEBUG_SERVER_PORT:-4000}"
export CODE_PATH="${CODE_PATH:-/app/data}"
export PGLITE_DATA_DIR="${PGLITE_DATA_DIR:-/app/data/pglite}"
export PORT="${PORT:-3002}"

mkdir -p "${CODE_PATH}" "${PGLITE_DATA_DIR}"

# Start soul-engine (internal only)
(
  cd /app/opensouls/packages/soul-engine-cloud
  exec bun run scripts/run-server.ts "${CODE_PATH}"
) &

# Give the engine a moment to boot (pglite bootstrap + worker pool).
sleep 3

# One-time: register the soul blueprint with the running engine.
# This is intentionally in start.sh (not Dockerfile) because the CLI requires a live websocket connection.
SOUL_INSTALL_MARKER="${CODE_PATH}/.tanaki-speaks-installed"
if [ ! -f "${SOUL_INSTALL_MARKER}" ]; then
  echo "[boot] registering tanaki-speaks blueprint (first run)..."
  (
    cd /app/packages/tanaki-speaks
    bunx soul-engine dev --once --noopen
  )
  touch "${SOUL_INSTALL_MARKER}"
else
  echo "[boot] tanaki-speaks already registered (${SOUL_INSTALL_MARKER})"
fi

# Start the Bun front server (public)
cd /app/packages/tanaki-speaks-web
exec bun run ./bun-server.ts


