#!/bin/bash

# Database backup script for PlannerProject
# Usage: ./scripts/backup-db.sh [backup-name]

set -e

# Default values
BACKUP_NAME=${1:-"backup-$(date +%Y%m%d-%H%M%S)"}
BACKUP_DIR="./backups"
DB_CONTAINER="plannerproject-postgres"
DB_NAME="plannerproject_dev"
DB_USER="planneruser"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Creating database backup: $BACKUP_NAME"

# Check if container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Database container '$DB_CONTAINER' is not running"
    echo "   Start it with: docker compose up -d"
    exit 1
fi

# Create backup
docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-password > "$BACKUP_DIR/$BACKUP_NAME.sql"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_NAME.sql"

echo "✅ Backup created: $BACKUP_DIR/$BACKUP_NAME.sql.gz"
echo "📊 Backup size: $(du -h "$BACKUP_DIR/$BACKUP_NAME.sql.gz" | cut -f1)"

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -lht "$BACKUP_DIR" | head -6