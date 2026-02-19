#!/usr/bin/env bash
# PostgreSQL backup script for Stward Task
# Usage: ./scripts/backup.sh
# Backups are stored in ./backups/ with automatic 7-day retention.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/stward_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "=== Stward Task — PostgreSQL Backup ==="
echo "Timestamp: $TIMESTAMP"

# Run pg_dump inside the db container
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
    | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Clean up backups older than retention period
DELETED=$(find "$BACKUP_DIR" -name "stward_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "Cleaned up $DELETED backup(s) older than $RETENTION_DAYS days."
fi

echo "=== Backup complete ==="
