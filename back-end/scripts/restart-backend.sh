#!/usr/bin/env bash
set -euo pipefail

# Restart backend using nodemon (canonical dev process).
# Kills any stale node processes on the backend port first.

PORT="${PORT:-8000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping stale backend processes on port ${PORT}..."
lsof -ti :"${PORT}" | xargs kill -9 2>/dev/null || true

echo "Starting backend with nodemon..."
cd "${SCRIPT_DIR}"
npm run start:dev
