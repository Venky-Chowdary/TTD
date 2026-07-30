#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

MONGO_CONTAINER=ttd-mongo
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  echo "Starting MongoDB container..."
  docker run -d --name "${MONGO_CONTAINER}" -p 27017:27017 --restart unless-stopped mongo:7 2>/dev/null || docker start "${MONGO_CONTAINER}"
fi

if [ ! -d "api/.venv" ]; then
  echo "Creating Python virtual environment..."
  cd api
  python3 -m venv .venv
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
