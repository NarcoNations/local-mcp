#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=${1:-/opt/mcp-memory}
USER=${2:-mcp}

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root" >&2
  exit 1
fi

useradd --system --create-home --shell /bin/bash "$USER" || true
mkdir -p "$REPO_DIR"
chown "$USER":"$USER" "$REPO_DIR"

sudo -u "$USER" git clone https://github.com/NarcoNations/local-mcp.git "$REPO_DIR" || true
cd "$REPO_DIR"

sudo -u "$USER" npm install
sudo -u "$USER" npm run build

install -m 0644 deploy/systemd/mcp-memory.service /etc/systemd/system/mcp-memory.service
systemctl daemon-reload
systemctl enable --now mcp-memory.service

echo "Installation complete. Populate /etc/mcp-memory/env with secrets (API_KEY, DB_URL, etc)."
