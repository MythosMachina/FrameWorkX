#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/setup/01-deps.sh

Checks and installs core host dependencies required for FrameWorkX setup.
Run as root.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root."
  exit 1
fi

detect_pm() {
  if command -v apt-get >/dev/null 2>&1; then
    echo apt
    return
  fi
  if command -v dnf >/dev/null 2>&1; then
    echo dnf
    return
  fi
  if command -v yum >/dev/null 2>&1; then
    echo yum
    return
  fi
  if command -v zypper >/dev/null 2>&1; then
    echo zypper
    return
  fi
  if command -v pacman >/dev/null 2>&1; then
    echo pacman
    return
  fi
  echo ""
}

required_cmds=(node npm python3 rsync tar psql systemctl)
missing=()
for c in "${required_cmds[@]}"; do
  if ! command -v "$c" >/dev/null 2>&1; then
    missing+=("$c")
  fi
done

node_major=0
if command -v node >/dev/null 2>&1; then
  node_major="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)"
fi
need_node_upgrade=0
if [[ "$node_major" -lt 20 ]]; then
  need_node_upgrade=1
fi

if [[ "$need_node_upgrade" -eq 1 && "${FX_ALLOW_NODE_UPGRADE:-0}" != "1" ]]; then
  echo "Node.js v20+ required. Detected: $(node -v 2>/dev/null || echo 'not installed')"
  echo "Re-run setup via scripts/setup/run.sh and confirm upgrade prompt, or set FX_ALLOW_NODE_UPGRADE=1."
  exit 42
fi

if [[ ${#missing[@]} -eq 0 && "$need_node_upgrade" -eq 0 ]]; then
  exit 0
fi

pm="$(detect_pm)"
if [[ -z "$pm" ]]; then
  echo "No supported package manager found. Missing commands: ${missing[*]}"
  exit 1
fi

case "$pm" in
  apt)
    apt-get update -y
    apt-get install -y nodejs npm python3 rsync tar postgresql-client ffmpeg unzip ca-certificates curl
    ;;
  dnf)
    dnf install -y nodejs npm python3 rsync tar postgresql ffmpeg unzip ca-certificates curl
    ;;
  yum)
    yum install -y nodejs npm python3 rsync tar postgresql ffmpeg unzip ca-certificates curl
    ;;
  zypper)
    zypper --non-interactive install nodejs npm python3 rsync tar postgresql ffmpeg unzip ca-certificates curl
    ;;
  pacman)
    pacman -Sy --noconfirm nodejs npm python rsync tar postgresql-libs ffmpeg unzip ca-certificates curl
    ;;
esac

still_missing=()
for c in "${required_cmds[@]}"; do
  if ! command -v "$c" >/dev/null 2>&1; then
    still_missing+=("$c")
  fi
done

if [[ ${#still_missing[@]} -gt 0 ]]; then
  echo "Missing required commands after install: ${still_missing[*]}"
  exit 1
fi

post_node_major="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)"
if [[ "$post_node_major" -lt 20 ]]; then
  echo "Node.js is still below v20 after package-manager install: $(node -v 2>/dev/null || echo 'not installed')"
  echo "Please install Node.js 20+ manually and rerun setup."
  exit 1
fi

exit 0
