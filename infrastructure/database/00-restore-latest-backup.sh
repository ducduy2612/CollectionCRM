#!/bin/bash
# Automatically restore from the latest backup when PostgreSQL container first starts
# This script runs before the database initialization scripts

# Load environment variables
source /etc/environment 2>/dev/null || true
source /var/lib/postgresql/.env 2>/dev/null || true

# Configuration
BACKUP_DIR="/backup"
DB_NAME=${POSTGRES_DB:-collectioncrm}
DB_USER=${POSTGRES_USER:-postgres}
LATEST_BACKUP="${BACKUP_DIR}/latest_backup.pgdump"
AUTO_RESTORE=${AUTO_RESTORE_ON_INIT:-true}

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check if automatic restore is enabled
if [ "$AUTO_RESTORE" != "true" ]; then
  log "Automatic restore is disabled. Skipping restore."
  exit 0
fi

# Check if database already exists and has data
if psql -U ${DB_USER} -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
  # Database exists, check if it has any tables (indicating it has been initialized)
  TABLE_COUNT=$(psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
  
  if [ "$TABLE_COUNT" -gt 0 ]; then
    log "Database ${DB_NAME} already exists and contains ${TABLE_COUNT} tables. Skipping restore."
    exit 0
  else
    log "Database ${DB_NAME} exists but is empty. Proceeding with restore..."
  fi
else
  log "Database ${DB_NAME} does not exist. Creating and restoring..."
fi

# Check if latest backup exists, if not find the most recent backup
if [ ! -f "$LATEST_BACKUP" ]; then
  log "No latest backup symlink found at ${LATEST_BACKUP}. Searching for most recent backup..."
  
  # Find the most recent backup file in daily, weekly, or monthly directories
  MOST_RECENT_BACKUP=$(find ${BACKUP_DIR} -name "*.pgdump" -type f -exec ls -t {} + 2>/dev/null | head -n 1)
  
  if [ -z "$MOST_RECENT_BACKUP" ]; then
    log "No backup files found in ${BACKUP_DIR}. Will proceed with normal initialization."
    exit 0
  else
    log "Found most recent backup: ${MOST_RECENT_BACKUP}"
    LATEST_BACKUP="$MOST_RECENT_BACKUP"
    
    # Create the symlink for future use
    ln -sf "${MOST_RECENT_BACKUP}" "${BACKUP_DIR}/latest_backup.pgdump"
    log "Created symlink ${BACKUP_DIR}/latest_backup.pgdump -> ${MOST_RECENT_BACKUP}"
  fi
fi

log "Found latest backup. Restoring database ${DB_NAME} from ${LATEST_BACKUP}..."

# Create the database if it doesn't exist
if ! psql -U ${DB_USER} -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
  log "Creating database ${DB_NAME}..."
  psql -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null
  if [ $? -ne 0 ]; then
    log "ERROR: Failed to create database ${DB_NAME}. Will proceed with normal initialization."
    exit 1
  fi
fi

# Restore directly (non-interactive mode)
log "Restoring database from backup: ${LATEST_BACKUP}"
pg_restore -U ${DB_USER} -d ${DB_NAME} --clean --if-exists --no-owner --no-privileges ${LATEST_BACKUP}

RESTORE_EXIT_CODE=$?
if [ $RESTORE_EXIT_CODE -eq 0 ]; then
  log "Database restore completed successfully!"
  
  # Verify the restore by checking table count
  TABLE_COUNT=$(psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
  log "Restored database contains ${TABLE_COUNT} tables."
  
  # Create a flag file to indicate that we've restored from backup
  touch "/tmp/db_restored_from_backup"
  
  # Prevent the other initialization scripts from running by creating a marker file
  # The Docker entrypoint checks for this file and skips initialization if it exists
  mkdir -p "/docker-entrypoint-initdb.d/init"
  touch "/docker-entrypoint-initdb.d/init/.initialized"
  
  log "Restore complete. Regular initialization scripts will be skipped."
  exit 0
else
  log "ERROR: Database restore failed with exit code ${RESTORE_EXIT_CODE}. Will proceed with normal initialization."
  log "Regular initialization scripts will run automatically from /docker-entrypoint-initdb.d/init/init-db.sql"
  
  # Clean up the potentially corrupted database
  log "Cleaning up potentially corrupted database..."
  psql -U ${DB_USER} -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null
  psql -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null
  
  exit 1
fi