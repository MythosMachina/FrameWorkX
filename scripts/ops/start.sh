#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.logs"
SESSION_NAME="frameworkx"
USE_TMUX=1

if [ "${FRAMEWORKX_NO_TMUX:-0}" = "1" ]; then
  USE_TMUX=0
fi

mkdir -p "$RUN_DIR" "$LOG_DIR"

start_process() {
  local name="$1"
  local cmd="$2"
  shift 2
  local pid_file="$RUN_DIR/${name}.pid"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file" || true)"
    if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
      echo "$name already running (pid $pid)"
      return
    fi
  fi

  echo "Starting $name..."
  nohup env "$@" bash -lc "cd \"$ROOT_DIR\"; set -a; [ -f .env ] && source .env; set +a; $cmd" > "$LOG_DIR/${name}.log" 2>&1 &
  echo $! > "$pid_file"
}

start_api() {
  start_process "api" "node \"$ROOT_DIR/apps/api/dist/main.js\""
}

start_indexer() {
  start_process "indexer" "node \"$ROOT_DIR/apps/indexer/dist/main.js\""
}

start_worker_role() {
  local role="$1"
  start_process "worker_${role}" "node \"$ROOT_DIR/apps/worker/dist/main.js\"" "FRAMEWORKX_ROLE=$role"
}

start_workers() {
  start_worker_role "health"
  start_worker_role "intake"
  start_worker_role "prep"
  start_worker_role "generation"
  start_worker_role "training"
  start_worker_role "credit"
  start_worker_role "stats"
}

start_ui() {
  local port="${FRAMEWORKX_UI_PORT:-5180}"
  start_process "ui" "npm run -w @frameworkx/ui preview -- --host 0.0.0.0 --port $port --strictPort"
}

target="${1:-all}"

case "$target" in
  all)
    if [ "$USE_TMUX" -eq 1 ] && command -v tmux >/dev/null 2>&1; then
      if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        echo "Session $SESSION_NAME already running."
      else
        tmux new -d -s "$SESSION_NAME" "$ROOT_DIR/scripts/ops/run.sh"
        echo "Started in tmux session: $SESSION_NAME"
      fi
    else
      start_api
      start_workers
      start_indexer
      start_ui
    fi
    ;;
  api)
    start_api
    ;;
  ui)
    start_ui
    ;;
  indexer)
    start_indexer
    ;;
  worker)
    start_workers
    ;;
  worker:*)
    start_worker_role "${target#worker:}"
    ;;
  *)
    echo "Unknown target: $target"
    echo "Usage: $0 [all|api|ui|indexer|worker|worker:<role>]"
    exit 1
    ;;
esac
