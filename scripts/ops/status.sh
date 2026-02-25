#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
SESSION_NAME="frameworkx"

if command -v tmux >/dev/null 2>&1; then
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "tmux session $SESSION_NAME: running"
  else
    echo "tmux session $SESSION_NAME: stopped"
  fi
fi

if [ ! -d "$RUN_DIR" ]; then
  echo "No run directory."
  exit 0
fi

for pid_file in "$RUN_DIR"/*.pid; do
  [ -e "$pid_file" ] || continue
  name="$(basename "$pid_file" .pid)"
  pid="$(cat "$pid_file" || true)"
  if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
    echo "$name running (pid $pid)"
  else
    echo "$name stopped"
  fi
done
