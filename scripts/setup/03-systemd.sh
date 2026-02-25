#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR=""
RUN_AS_USER="frameworkx"
RUN_AS_GROUP=""
SYSTEMD_DIR="/etc/systemd/system"
ENABLE_UNITS=1
RUN_BUILD=1
RUN_MIGRATE=1

usage() {
  cat <<'EOF'
Usage:
  scripts/setup/03-systemd.sh --target-dir PATH [options]

Options:
  --target-dir PATH      Required install target path
  --run-user NAME        Runtime user (default: frameworkx)
  --run-group NAME       Runtime group (default: same as --run-user)
  --systemd-dir PATH     systemd unit path (default: /etc/systemd/system)
  --no-enable            Install units without enable/start
  --skip-build           Skip npm build
  --skip-migrate         Skip DB migration
  -h, --help             Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-dir)
      TARGET_DIR="$2"
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
    --systemd-dir)
      SYSTEMD_DIR="$2"
      shift 2
      ;;
    --no-enable)
      ENABLE_UNITS=0
      shift
      ;;
    --skip-build)
      RUN_BUILD=0
      shift
      ;;
    --skip-migrate)
      RUN_MIGRATE=0
      shift
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

if [[ ! -d "$TARGET_DIR/scripts/systemd" ]]; then
  echo "Missing templates in $TARGET_DIR/scripts/systemd"
  exit 1
fi

run_as_user() {
  runuser -u "$RUN_AS_USER" -- bash -lc "$1"
}

run_as_user "cd '$TARGET_DIR' && npm install"

if [[ "$RUN_BUILD" -eq 1 ]]; then
  run_as_user "cd '$TARGET_DIR' && npm run build"
fi

if [[ "$RUN_MIGRATE" -eq 1 ]]; then
  run_as_user "cd '$TARGET_DIR' && set -a && source '$TARGET_DIR/.env' && set +a && npm run -w @frameworkx/db migrate"
fi

render_unit() {
  local src="$1"
  local dst="$2"
  sed \
    -e "s|__APP_DIR__|$TARGET_DIR|g" \
    -e "s|__ENV_FILE__|$TARGET_DIR/.env|g" \
    -e "s|__RUN_AS_USER__|$RUN_AS_USER|g" \
    -e "s|__RUN_AS_GROUP__|$RUN_AS_GROUP|g" \
    "$src" > "$dst"
}

tmp_units="$(mktemp -d)"
trap 'rm -rf "$tmp_units"' EXIT

for tpl in "$TARGET_DIR"/scripts/systemd/*.service.tpl; do
  unit_name="$(basename "$tpl" .tpl)"
  rendered="$tmp_units/$unit_name"
  render_unit "$tpl" "$rendered"
  install -m 0644 "$rendered" "$SYSTEMD_DIR/$unit_name"
done

systemctl daemon-reload

if [[ "$ENABLE_UNITS" -eq 1 ]]; then
  systemctl enable --now frameworkx-api frameworkx-ui frameworkx-edge frameworkx-indexer
  systemctl enable --now \
    frameworkx-worker@health \
    frameworkx-worker@intake \
    frameworkx-worker@prep \
    frameworkx-worker@generation \
    frameworkx-worker@training \
    frameworkx-worker@credit \
    frameworkx-worker@stats \
    frameworkx-worker@notification
fi

exit 0

