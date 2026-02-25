#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

TARGET_DIR=""
ENV_SOURCE=""
RUN_AS_USER="frameworkx"
RUN_AS_GROUP=""

usage() {
  cat <<'EOF'
Usage:
  scripts/setup/02-provision.sh --target-dir PATH [options]

Options:
  --target-dir PATH      Required install target path
  --env-source PATH      Optional source .env file copied to target
  --run-user NAME        Runtime user (default: frameworkx)
  --run-group NAME       Runtime group (default: same as --run-user)
  -h, --help             Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-dir)
      TARGET_DIR="$2"
      shift 2
      ;;
    --env-source)
      ENV_SOURCE="$2"
      shift 2
      ;;
    --run-user)
      RUN_AS_USER="$2"
      shift 2
      ;;
    --run-group)
      RUN_AS_GROUP="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$TARGET_DIR" ]]; then
  usage
  exit 1
fi

if [[ -z "$RUN_AS_GROUP" ]]; then
  RUN_AS_GROUP="$RUN_AS_USER"
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root."
  exit 1
fi

ensure_group() {
  local grp="$1"
  if ! getent group "$grp" >/dev/null 2>&1; then
    groupadd --system "$grp"
  fi
}

ensure_user() {
  local usr="$1"
  local grp="$2"
  if ! id "$usr" >/dev/null 2>&1; then
    useradd --system --gid "$grp" --home-dir "$TARGET_DIR" --shell /usr/sbin/nologin "$usr" || \
      useradd --system --gid "$grp" --home "$TARGET_DIR" --shell /usr/sbin/nologin "$usr"
  fi
}

ensure_group "$RUN_AS_GROUP"
ensure_user "$RUN_AS_USER" "$RUN_AS_GROUP"

mkdir -p "$TARGET_DIR" "$TARGET_DIR/storage" "$TARGET_DIR/logs" "$TARGET_DIR/.logs" "$TARGET_DIR/.run"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude ".git/" \
    --exclude ".env" \
    --exclude "node_modules/" \
    --exclude ".venv/" \
    --exclude ".venv-trainer/" \
    --exclude "storage/" \
    --exclude "logs/" \
    --exclude ".logs/" \
    --exclude ".run/" \
    --exclude "*.log" \
    "$SOURCE_DIR"/ "$TARGET_DIR"/
else
  tmp_archive="$(mktemp /tmp/frameworkx-copy-XXXXXX.tar)"
  trap 'rm -f "$tmp_archive"' EXIT
  tar -C "$SOURCE_DIR" \
    --exclude=".git" \
    --exclude=".env" \
    --exclude="node_modules" \
    --exclude=".venv" \
    --exclude=".venv-trainer" \
    --exclude="storage" \
    --exclude="logs" \
    --exclude=".logs" \
    --exclude=".run" \
    --exclude="*.log" \
    -cf "$tmp_archive" .
  tar -C "$TARGET_DIR" -xf "$tmp_archive"
fi

if [[ -n "$ENV_SOURCE" ]]; then
  if [[ ! -f "$ENV_SOURCE" ]]; then
    echo "env source not found: $ENV_SOURCE"
    exit 1
  fi
  install -m 0600 "$ENV_SOURCE" "$TARGET_DIR/.env"
elif [[ -f "$SOURCE_DIR/.env" ]]; then
  install -m 0600 "$SOURCE_DIR/.env" "$TARGET_DIR/.env"
elif [[ ! -f "$TARGET_DIR/.env" ]]; then
  install -m 0600 "$TARGET_DIR/.env.example" "$TARGET_DIR/.env"
fi

chmod +x "$TARGET_DIR"/scripts/setup/*.sh
chown -R "$RUN_AS_USER:$RUN_AS_GROUP" "$TARGET_DIR"

exit 0
