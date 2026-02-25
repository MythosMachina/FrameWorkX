#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
SESSION_NAME="frameworkx"

is_any_pid_running() {
  for pid_file in "$RUN_DIR"/*.pid; do
    [ -e "$pid_file" ] || continue
    local pid
    pid="$(cat "$pid_file" || true)"
    if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  done
  return 1
}

target="${1:-all}"
if [ "$target" = "all" ]; then
  "$ROOT_DIR/scripts/ops/stop.sh"
else
  FRAMEWORKX_SKIP_TMUX_KILL=1 "$ROOT_DIR/scripts/ops/stop.sh"
fi
"$ROOT_DIR/scripts/ops/start.sh" "$target"

if command -v tmux >/dev/null 2>&1; then
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    exit 0
  fi
fi

if is_any_pid_running; then
  exit 0
fi

echo "No services detected after restart; falling back to non-tmux start."
FRAMEWORKX_NO_TMUX=1 "$ROOT_DIR/scripts/ops/start.sh" "${1:-all}"
