#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=${1:-/var/backups/mcp-memory}
DATA_ROOT=${DATA_ROOT:-.mcp-memory}
DB_URL=${DB_URL:-}

if [[ -z "$DB_URL" ]]; then
  echo "DB_URL environment variable required" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

pg_dump "$DB_URL" > "$BACKUP_DIR/mcp-memory-$TIMESTAMP.sql"

tar -czf "$BACKUP_DIR/mcp-memory-sections-$TIMESTAMP.tgz" "$DATA_ROOT"
