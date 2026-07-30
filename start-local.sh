#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

MONGO_CONTAINER=ttd-mongo
MONGO_URL=${MONGO_URL:-mongodb://localhost:27017}

# Detect Python first because the backend needs it.
PYTHON_CMD=""
for cmd in python3 python; do
  if command -v "$cmd" >/dev/null 2>&1; then
    PYTHON_CMD=$cmd
    break
  fi
done

if [ -z "$PYTHON_CMD" ]; then
  echo "ERROR: Python is not installed. Install Python 3.11+ from https://www.python.org/downloads/"
  exit 1
fi

# Detect a working MongoDB connection on localhost:27017 (default).
function wait_for_mongo() {
  local host=${1:-localhost}
  local port=${2:-27017}
  "$PYTHON_CMD" - <<PY 2>/dev/null
import socket, sys
try:
    s = socket.create_connection(("$host", $port), timeout=2)
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
PY
}

function start_docker_mongo() {
  if ! docker info >/dev/null 2>&1; then
    return 1
  fi
  if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
    echo "Starting MongoDB container..."
    docker run -d --name "${MONGO_CONTAINER}" -p 27017:27017 --restart unless-stopped mongo:7 2>/dev/null || docker start "${MONGO_CONTAINER}"
  fi
  return 0
}

# Try Docker first, then fall back to a local mongod.
if ! wait_for_mongo; then
  if start_docker_mongo; then
    echo "Waiting for MongoDB to be ready..."
    for i in {1..12}; do
      wait_for_mongo && break
      sleep 1
    done
  fi
fi

if ! wait_for_mongo; then
  echo "ERROR: MongoDB is not reachable at localhost:27017"
  echo "Start Docker Desktop and run 'make dev' again, or start a local mongod."
  exit 1
fi

export MONGO_URL="$MONGO_URL"

if [ ! -d "api/.venv" ]; then
  echo "Creating Python virtual environment..."
  cd api
  "$PYTHON_CMD" -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  cd ..
fi

echo "Starting backend..."
cd api
source .venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../api.log 2>&1 &
cd ..

echo "Starting frontend..."
nohup npx vite --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &

echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Logs: api.log and frontend.log"
echo "Stop with: make stop"
