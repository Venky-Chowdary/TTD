#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

MONGO_CONTAINER=ttd-mongo
MONGO_URL=${MONGO_URL:-mongodb://localhost:27017}

# Detect a working MongoDB connection.
function wait_for_mongo() {
  local url=$1
  python3 - <<PY 2>/dev/null
import sys
try:
    from pymongo import MongoClient
    c = MongoClient("$url", serverSelectionTimeoutMS=2000)
    c.admin.command("ping")
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
if ! wait_for_mongo "$MONGO_URL"; then
  if start_docker_mongo; then
    echo "Waiting for MongoDB to be ready..."
    for i in {1..12}; do
      wait_for_mongo "$MONGO_URL" && break
      sleep 1
    done
  fi
fi

if ! wait_for_mongo "$MONGO_URL"; then
  echo "ERROR: MongoDB is not reachable at $MONGO_URL"
  echo "Start Docker Desktop and run 'make dev' again, or start a local mongod."
  exit 1
fi

# Detect Python.
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
