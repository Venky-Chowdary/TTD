#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

MONGO_CONTAINER=ttd-mongo
MONGO_URL=${MONGO_URL:-mongodb://localhost:27017}
MONGO_PORT=27017
MONGO_DATA_DIR=${MONGO_DATA_DIR:-$HOME/.ttd-mongo-data}

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

# Ensure pip is available.
if ! "$PYTHON_CMD" -m pip --version >/dev/null 2>&1; then
  echo "pip not found for $PYTHON_CMD. Trying to install it..."
  "$PYTHON_CMD" -m ensurepip --upgrade --default-pip 2>/dev/null || true
  if ! "$PYTHON_CMD" -m pip --version >/dev/null 2>&1; then
    echo "ERROR: Could not install pip. Run: curl https://bootstrap.pypa.io/get-pip.py | $PYTHON_CMD"
    exit 1
  fi
fi

# Detect a working MongoDB connection.
function mongo_is_up() {
  "$PYTHON_CMD" - <<PY 2>/dev/null
import socket, sys
try:
    s = socket.create_connection(("localhost", $MONGO_PORT), timeout=1)
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

function start_local_mongo() {
  if ! command -v mongod >/dev/null 2>&1; then
    return 1
  fi
  mkdir -p "$MONGO_DATA_DIR"
  echo "Starting local mongod (data: $MONGO_DATA_DIR)..."
  nohup mongod --dbpath "$MONGO_DATA_DIR" --bind_ip 127.0.0.1 --port 27017 > mongo.log 2>&1 &
  return 0
}

# Try to get MongoDB running.
if ! mongo_is_up; then
  if ! start_docker_mongo; then
    start_local_mongo || true
  fi
fi

if ! mongo_is_up; then
  echo "Waiting for MongoDB to be ready..."
  for i in {1..15}; do
    mongo_is_up && break
    sleep 1
  done
fi

if ! mongo_is_up; then
  echo "ERROR: MongoDB is not reachable at localhost:27017"
  echo "Start Docker Desktop, or install/run mongod, then run 'make dev' again."
  exit 1
fi

export MONGO_URL="$MONGO_URL"

# Install Python dependencies (prefer venv, fall back to user site-packages).
if [ -d "api/.venv" ] && [ ! -f "api/.venv/bin/activate" ]; then
  echo "Removing broken venv..."
  rm -rf api/.venv
fi

if [ ! -d "api/.venv" ]; then
  echo "Creating Python virtual environment..."
  if "$PYTHON_CMD" -m venv api/.venv 2>/dev/null; then
    echo "venv created."
  else
    echo "Could not create venv. Falling back to --user install."
  fi
fi

if [ -d "api/.venv" ] && [ -f "api/.venv/bin/activate" ]; then
  source api/.venv/bin/activate
  pip install -r api/requirements.txt
else
  "$PYTHON_CMD" -m pip install --user -r api/requirements.txt
fi

echo "Starting backend..."
if [ -d "api/.venv" ] && [ -f "api/.venv/bin/uvicorn" ]; then
  nohup api/.venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload > api.log 2>&1 &
elif command -v uvicorn >/dev/null 2>&1; then
  nohup uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload > api.log 2>&1 &
else
  nohup "$PYTHON_CMD" -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload > api.log 2>&1 &
fi

echo "Starting frontend..."
nohup npx vite --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &

echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Logs: api.log and frontend.log"
echo "Stop with: make stop"
