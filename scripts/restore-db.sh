#!/bin/bash

# Database restore script for PlannerProject
# Usage: ./scripts/restore-db.sh <backup-file>

set -e

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a backup file"
    echo "   Usage: ./scripts/restore-db.sh <backup-file>"
    echo ""
    echo "📋 Available backups:"
    ls -lt ./backups/ 2>/dev/null || echo "   No backups found in ./backups/"
    exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="plannerproject-postgres"
DB_NAME="plannerproject_dev"
DB_USER="planneruser"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file '$BACKUP_FILE' not found"
    exit 1
fi

echo "🔄 Restoring database from: $BACKUP_FILE"

# Check if container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Database container '$DB_CONTAINER' is not running"
    echo "   Start it with: docker compose up -d"
    exit 1
fi

# Warning prompt
read -p "⚠️  This will replace all data in the database. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Decompressing backup..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Drop and recreate database
echo "🗑️  Dropping existing database..."
docker exec -t "$DB_CONTAINER" dropdb -U "$DB_USER" --if-exists "$DB_NAME"
docker exec -t "$DB_CONTAINER" createdb -U "$DB_USER" "$DB_NAME"

# Restore backup
echo "📥 Restoring data..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$RESTORE_FILE"

# Clean up temp file if created
if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm "$TEMP_FILE"
fi

echo "✅ Database restored successfully from $BACKUP_FILE"
echo "🔄 You may need to run: npm run db:generate"