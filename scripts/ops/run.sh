#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.logs"

mkdir -p "$RUN_DIR" "$LOG_DIR"

start_child() {
  local name="$1"
  shift
  local cmd="$1"
  shift
  local pid_file="$RUN_DIR/${name}.pid"

  echo "Starting $name..."
  env "$@" bash -lc "cd \"$ROOT_DIR\"; set -a; [ -f .env ] && source .env; set +a; exec $cmd" > "$LOG_DIR/${name}.log" 2>&1 &
  echo $! > "$pid_file"
}

stop_child() {
  local pid_file="$1"
  [ -e "$pid_file" ] || return
  local pid
  pid="$(cat "$pid_file" || true)"
  if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" || true
  fi
  rm -f "$pid_file"
}

cleanup() {
  for pid_file in "$RUN_DIR"/*.pid; do
    [ -e "$pid_file" ] || continue
    stop_child "$pid_file"
  done
}

trap cleanup EXIT INT TERM

start_child "api" "node \"$ROOT_DIR/apps/api/dist/main.js\""
start_child "worker_health" "node \"$ROOT_DIR/apps/worker/dist/main.js\"" "FRAMEWORKX_ROLE=health"
start_child "worker_intake" "node \"$ROOT_DIR/apps/worker/dist/main.js\"" "FRAMEWORKX_ROLE=intake"
start_child "worker_prep" "node \"$ROOT_DIR/apps/worker/dist/main.js\"" "FRAMEWORKX_ROLE=prep"
start_child "worker_generation" "node \"$ROOT_DIR/apps/worker/dist/main.js\"" "FRAMEWORKX_ROLE=generation"
start_child "worker_training" "node \"$ROOT_DIR/apps/worker/dist/main.js\"" "FRAMEWORKX_ROLE=training"
start_child "worker_credit" "node \"$ROOT_DIR/apps/worker/dist/main.js\"" "FRAMEWORKX_ROLE=credit"
start_child "worker_stats" "node \"$ROOT_DIR/apps/worker/dist/main.js\"" "FRAMEWORKX_ROLE=stats"
start_child "indexer" "node \"$ROOT_DIR/apps/indexer/dist/main.js\""

ui_port="${FRAMEWORKX_UI_PORT:-5180}"
start_child "ui" "npm run -w @frameworkx/ui preview -- --host 0.0.0.0 --port $ui_port --strictPort"

echo "All services started. Monitoring..."

while true; do
  if ! wait -n; then
    echo "A service exited. Shutting down."
    exit 1
  fi
done
