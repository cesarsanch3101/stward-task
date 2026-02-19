#!/usr/bin/env bash
# PostgreSQL restore script for Stward Task
# Usage: ./scripts/restore.sh <backup_file.sql.gz>

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ls -lh "$(dirname "$SCRIPT_DIR")/backups/"stward_backup_*.sql.gz 2>/dev/null || echo "  (none found)"
    exit 1
fi

BACKUP_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=== Stward Task — PostgreSQL Restore ==="
echo "Restoring from: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database!"
read -r -p "Continue? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

gunzip -c "$BACKUP_FILE" | docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" --quiet

echo "=== Restore complete ==="
