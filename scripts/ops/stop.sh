#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
SESSION_NAME="frameworkx"
SKIP_TMUX_KILL="${FRAMEWORKX_SKIP_TMUX_KILL:-0}"

if [ "$SKIP_TMUX_KILL" != "1" ]; then
  if command -v tmux >/dev/null 2>&1; then
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
      echo "Stopping tmux session $SESSION_NAME..."
      tmux kill-session -t "$SESSION_NAME"
    fi
  fi
fi

if [ ! -d "$RUN_DIR" ]; then
  echo "No run directory."
  exit 0
fi

stop_pid() {
  local pid_file="$1"
  local name
  name="$(basename "$pid_file" .pid)"
  local pid
  pid="$(cat "$pid_file" || true)"
  if [ -z "${pid:-}" ]; then
    rm -f "$pid_file"
    return
  fi
  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping $name (pid $pid)..."
    kill "$pid" || true
    for _ in {1..10}; do
      if kill -0 "$pid" 2>/dev/null; then
        sleep 0.3
      else
        break
      fi
    done
    if kill -0 "$pid" 2>/dev/null; then
      echo "Force killing $name (pid $pid)"
      kill -9 "$pid" || true
    fi
  fi
  rm -f "$pid_file"
}

for pid_file in "$RUN_DIR"/*.pid; do
  [ -e "$pid_file" ] || continue
  stop_pid "$pid_file"
done
