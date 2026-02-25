#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"

if [ ! -d "$LOG_DIR" ]; then
  echo "No logs directory."
  exit 0
fi

target="${1:-all}"

if [ "$target" = "all" ]; then
  for log in "$LOG_DIR"/*.log; do
    [ -e "$log" ] || continue
    echo "==> $(basename "$log") <=="
    tail -n 200 "$log"
  done
  exit 0
fi

log_file="$LOG_DIR/${target}.log"
if [ ! -f "$log_file" ]; then
  echo "Log not found: $log_file"
  exit 1
fi

tail -n 200 "$log_file"
