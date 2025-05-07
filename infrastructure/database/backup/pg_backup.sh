#!/bin/bash
# PostgreSQL Database Backup Script for CollectionCRM
# This script creates compressed backups of the PostgreSQL database

# Load environment variables
source /etc/environment
source /var/lib/postgresql/.env 2>/dev/null || true

# Configuration
BACKUP_DIR="/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
COMPRESSION_LEVEL=${BACKUP_COMPRESSION_LEVEL:-9}
DB_NAME=${POSTGRES_DB:-collectioncrm}
DB_USER=${POSTGRES_USER:-postgres}

# Create backup directory structure
DAILY_BACKUP_DIR="${BACKUP_DIR}/daily"
WEEKLY_BACKUP_DIR="${BACKUP_DIR}/weekly"
MONTHLY_BACKUP_DIR="${BACKUP_DIR}/monthly"

mkdir -p ${DAILY_BACKUP_DIR}
mkdir -p ${WEEKLY_BACKUP_DIR}
mkdir -p ${MONTHLY_BACKUP_DIR}

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Perform backup
perform_backup() {
  local backup_file="$1"
  
  log "Starting backup to ${backup_file}"
  
  # Create a compressed backup
  pg_dump -U ${DB_USER} -d ${DB_NAME} -F c -Z ${COMPRESSION_LEVEL} -f ${backup_file}
  
  if [ $? -eq 0 ]; then
    log "Backup completed successfully: ${backup_file}"
    # Set appropriate permissions
    chmod 640 ${backup_file}
    return 0
  else
    log "ERROR: Backup failed!"
    return 1
  fi
}

# Create daily backup
DAILY_BACKUP_FILE="${DAILY_BACKUP_DIR}/${DB_NAME}_daily_${TIMESTAMP}.pgdump"
perform_backup "${DAILY_BACKUP_FILE}"

# Create weekly backup (on Sundays)
if [ $(date +"%u") -eq 7 ]; then
  WEEKLY_BACKUP_FILE="${WEEKLY_BACKUP_DIR}/${DB_NAME}_weekly_$(date +"%Y%m%d").pgdump"
  cp "${DAILY_BACKUP_FILE}" "${WEEKLY_BACKUP_FILE}"
  log "Weekly backup created: ${WEEKLY_BACKUP_FILE}"
fi

# Create monthly backup (on the 1st of each month)
if [ $(date +"%d") -eq 01 ]; then
  MONTHLY_BACKUP_FILE="${MONTHLY_BACKUP_DIR}/${DB_NAME}_monthly_$(date +"%Y%m").pgdump"
  cp "${DAILY_BACKUP_FILE}" "${MONTHLY_BACKUP_FILE}"
  log "Monthly backup created: ${MONTHLY_BACKUP_FILE}"
fi

# Cleanup old backups
log "Cleaning up old backups..."

# Delete daily backups older than BACKUP_RETENTION_DAYS days
find ${DAILY_BACKUP_DIR} -name "*.pgdump" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete

# Delete weekly backups older than 3 months (90 days)
find ${WEEKLY_BACKUP_DIR} -name "*.pgdump" -type f -mtime +90 -delete

# Delete monthly backups older than 1 year (365 days)
find ${MONTHLY_BACKUP_DIR} -name "*.pgdump" -type f -mtime +365 -delete

log "Backup process completed"

# Create a symlink to the latest backup
ln -sf "${DAILY_BACKUP_FILE}" "${BACKUP_DIR}/latest_backup.pgdump"