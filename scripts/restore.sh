#!/usr/bin/env bash
set -euo pipefail

BACKUP_SQL=${1:?Usage: restore.sh path/to/backup.sql path/to/sections.tgz}
BACKUP_TGZ=${2:?Usage: restore.sh path/to/backup.sql path/to/sections.tgz}
DB_URL=${DB_URL:-}
DATA_ROOT=${DATA_ROOT:-.mcp-memory}

if [[ -z "$DB_URL" ]]; then
  echo "DB_URL environment variable required" >&2
  exit 1
fi

psql "$DB_URL" < "$BACKUP_SQL"
rm -rf "$DATA_ROOT"
tar -xzf "$BACKUP_TGZ"
