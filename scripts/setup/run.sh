#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

TARGET_DIR=""
ENV_SOURCE=""
RUN_AS_USER="frameworkx"
RUN_AS_GROUP=""
ENABLE_UNITS=1
SKIP_BUILD=0
SKIP_MIGRATE=0
LOG_FILE="$ROOT_DIR/setup.log"

usage() {
  cat <<'EOF'
Usage:
  scripts/setup/run.sh --target-dir PATH [options]

Options:
  --target-dir PATH      Required install target path
  --env-source PATH      Optional source .env file
  --run-user NAME        Runtime user (default: frameworkx)
  --run-group NAME       Runtime group (default: same as --run-user)
  --no-enable            Do not auto-enable/start services
  --skip-build           Skip npm build
  --skip-migrate         Skip DB migration
  --log-file PATH        Setup log path (default: ./setup.log)
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
    --no-enable)
      ENABLE_UNITS=0
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --skip-migrate)
      SKIP_MIGRATE=1
      shift
      ;;
    --log-file)
      LOG_FILE="$2"
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
  read -r -p "Install target path (e.g. /opt/FrameWorkX): " TARGET_DIR
fi

if [[ -z "$TARGET_DIR" ]]; then
  echo "No target path provided."
  exit 1
fi

if [[ -z "$RUN_AS_GROUP" ]]; then
  RUN_AS_GROUP="$RUN_AS_USER"
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Please run with sudo/root."
  exit 1
fi

check_node_version() {
  local node_major=0
  local node_ver="not installed"
  if command -v node >/dev/null 2>&1; then
    node_ver="$(node -v 2>/dev/null || echo "unknown")"
    node_major="$(echo "$node_ver" | sed -E 's/^v([0-9]+).*/\1/' || echo 0)"
  fi

  if [[ "$node_major" -ge 20 ]]; then
    return 0
  fi

  cat <<EOF
Node.js v20+ is required for FrameWorkX setup.
Detected on host: $node_ver

Updating Node.js via system packages can affect other applications on this server.
EOF

  if [[ ! -t 0 ]]; then
    echo "Non-interactive shell detected. Re-run interactively or set FX_ALLOW_NODE_UPGRADE=1."
    exit 1
  fi

  while true; do
    read -r -p "Allow Node.js update now and continue setup? [y/N]: " reply
    case "${reply:-}" in
      y|Y|yes|YES)
        export FX_ALLOW_NODE_UPGRADE=1
        return 0
        ;;
      n|N|no|NO|"")
        echo "Setup cancelled. No changes were applied by this script."
        exit 1
        ;;
      *)
        echo "Please answer y or n."
        ;;
    esac
  done
}

check_node_version

status_file="$(mktemp /tmp/frameworkx-setup-status-XXXXXX)"
trap 'rm -f "$status_file"' EXIT

echo "setup:init" > "$status_file"
: > "$LOG_FILE"

run_pipeline() {
  echo "setup:deps" > "$status_file"
  "$SCRIPT_DIR/01-deps.sh"

  echo "setup:provision" > "$status_file"
  provision_args=(--target-dir "$TARGET_DIR" --run-user "$RUN_AS_USER" --run-group "$RUN_AS_GROUP")
  if [[ -n "$ENV_SOURCE" ]]; then
    provision_args+=(--env-source "$ENV_SOURCE")
  fi
  "$SCRIPT_DIR/02-provision.sh" "${provision_args[@]}"

  echo "setup:systemd" > "$status_file"
  systemd_args=(--target-dir "$TARGET_DIR" --run-user "$RUN_AS_USER" --run-group "$RUN_AS_GROUP")
  if [[ "$ENABLE_UNITS" -eq 0 ]]; then
    systemd_args+=(--no-enable)
  fi
  if [[ "$SKIP_BUILD" -eq 1 ]]; then
    systemd_args+=(--skip-build)
  fi
  if [[ "$SKIP_MIGRATE" -eq 1 ]]; then
    systemd_args+=(--skip-migrate)
  fi
  "$SCRIPT_DIR/03-systemd.sh" "${systemd_args[@]}"

  echo "setup:done" > "$status_file"
}

run_pipeline >>"$LOG_FILE" 2>&1 &
setup_pid=$!

spinner='|/-\'
i=0

label_for() {
  case "$1" in
    setup:init) echo "Initializing setup..." ;;
    setup:deps) echo "Step 1/3: Checking and installing dependencies..." ;;
    setup:provision) echo "Step 2/3: Creating user, folders, permissions, copying app..." ;;
    setup:systemd) echo "Step 3/3: Building app, configuring systemd, starting services..." ;;
    setup:done) echo "Setup complete." ;;
    *) echo "Running setup..." ;;
  esac
}

while kill -0 "$setup_pid" >/dev/null 2>&1; do
  status="$(cat "$status_file" 2>/dev/null || echo "setup:init")"
  msg="$(label_for "$status")"
  c="${spinner:i++%${#spinner}:1}"
  printf "\r[%s] %s" "$c" "$msg"
  sleep 0.2
done

wait "$setup_pid" || {
  printf "\nSetup failed. See log: %s\n" "$LOG_FILE"
  exit 1
}

printf "\r[OK] Setup complete.                                              \n"

ui_port="5180"
if [[ -f "$TARGET_DIR/.env" ]]; then
  env_port="$(grep -E '^FRAMEWORKX_UI_PORT=' "$TARGET_DIR/.env" | head -n1 | cut -d'=' -f2- || true)"
  if [[ -n "${env_port:-}" ]]; then
    ui_port="$(echo "$env_port" | tr -d "\"'" | tr -d '[:space:]')"
  fi
fi

server_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [[ -z "${server_ip:-}" ]]; then
  server_ip="$(ip route get 1.1.1.1 2>/dev/null | awk '/src/ {for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -n1)"
fi
if [[ -z "${server_ip:-}" ]]; then
  server_ip="127.0.0.1"
fi

app_url="http://${server_ip}:${ui_port}"

cat <<EOF

Setup log:
  $LOG_FILE

App URL:
  $app_url

Service status:
  systemctl list-units 'frameworkx*' --all --no-pager

First user creation:
  curl -s -X POST http://${server_ip}:5100/api/auth/register \\
    -H "Content-Type: application/json" \\
    -d '{"email":"you@example.com","username":"your_user","password":"your_password"}'

EOF

exit 0
