#!/bin/bash
# PostgreSQL Database Restore Script for CollectionCRM
# This script restores a database from a backup file

# Load environment variables
source /etc/environment
source /var/lib/postgresql/.env 2>/dev/null || true

# Configuration
BACKUP_DIR="/backup"
DB_NAME=${POSTGRES_DB:-collectioncrm}
DB_USER=${POSTGRES_USER:-postgres}

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Display usage information
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Restore PostgreSQL database from backup"
  echo ""
  echo "Options:"
  echo "  -f, --file FILENAME    Specify backup file to restore (required if -l not used)"
  echo "  -l, --latest           Restore from latest backup"
  echo "  -h, --help             Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --latest"
  echo "  $0 --file /backup/daily/collectioncrm_daily_20250505_120000.pgdump"
  exit 1
}

# Parse command line arguments
BACKUP_FILE=""
USE_LATEST=false

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -f|--file)
      BACKUP_FILE="$2"
      shift
      shift
      ;;
    -l|--latest)
      USE_LATEST=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Check if we have a backup file to restore
if [ "$USE_LATEST" = true ]; then
  BACKUP_FILE="${BACKUP_DIR}/latest_backup.pgdump"
  if [ ! -f "$BACKUP_FILE" ]; then
    log "ERROR: Latest backup file not found!"
    exit 1
  fi
elif [ -z "$BACKUP_FILE" ]; then
  log "ERROR: No backup file specified!"
  usage
elif [ ! -f "$BACKUP_FILE" ]; then
  log "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

log "Starting restore from backup: $BACKUP_FILE"

# Confirm before proceeding
read -p "WARNING: This will overwrite the current database. Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log "Restore cancelled."
  exit 0
fi

# Create a temporary database name for the restore
TEMP_DB="${DB_NAME}_restore_$(date +%s)"

log "Creating temporary database: $TEMP_DB"
createdb -U ${DB_USER} ${TEMP_DB}

if [ $? -ne 0 ]; then
  log "ERROR: Failed to create temporary database!"
  exit 1
fi

# Restore to the temporary database
log "Restoring backup to temporary database..."
pg_restore -U ${DB_USER} -d ${TEMP_DB} ${BACKUP_FILE}

if [ $? -ne 0 ]; then
  log "ERROR: Restore to temporary database failed!"
  log "Cleaning up temporary database..."
  dropdb -U ${DB_USER} ${TEMP_DB}
  exit 1
fi

# Verify the restore
log "Verifying restored database..."
psql -U ${DB_USER} -d ${TEMP_DB} -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname IN ('auth_service', 'bank_sync_service', 'payment_service', 'workflow_service');"

# Confirm before replacing production database
read -p "Proceed with replacing the production database? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log "Production database replacement cancelled."
  log "Cleaning up temporary database..."
  dropdb -U ${DB_USER} ${TEMP_DB}
  exit 0
fi

# Rename databases to swap them
log "Renaming databases to perform swap..."
log "Disconnecting all clients from the current database..."

# Disconnect all clients from the current database
psql -U ${DB_USER} -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${DB_NAME}'
  AND pid <> pg_backend_pid();"

# Rename the current database to a backup name
BACKUP_DB_NAME="${DB_NAME}_pre_restore_$(date +%s)"
log "Renaming current database to ${BACKUP_DB_NAME}..."
psql -U ${DB_USER} -d postgres -c "ALTER DATABASE ${DB_NAME} RENAME TO ${BACKUP_DB_NAME};"

# Rename the temporary database to the production name
log "Renaming restored database to ${DB_NAME}..."
psql -U ${DB_USER} -d postgres -c "ALTER DATABASE ${TEMP_DB} RENAME TO ${DB_NAME};"

log "Database restore completed successfully!"
log "The previous database is available as ${BACKUP_DB_NAME} if needed."
log "You may drop it with: dropdb -U ${DB_USER} ${BACKUP_DB_NAME}"