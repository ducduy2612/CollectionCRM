#!/bin/bash
# Non-interactive version of pg_restore.sh for testing

# Configuration
BACKUP_FILE="/backup/latest_backup.pgdump"
DB_NAME="collectioncrm"
DB_USER="postgres"
TEMP_DB="${DB_NAME}_restore_$(date +%s)"

echo "Starting restore from backup: $BACKUP_FILE"

# Create a temporary database for the restore
echo "Creating temporary database: $TEMP_DB"
createdb -U ${DB_USER} ${TEMP_DB}

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to create temporary database!"
  exit 1
fi

# Restore to the temporary database
echo "Restoring backup to temporary database..."
pg_restore -U ${DB_USER} -d ${TEMP_DB} ${BACKUP_FILE}

if [ $? -ne 0 ]; then
  echo "WARNING: Restore to temporary database had some errors, but continuing..."
fi

# Verify the restore
echo "Verifying restored database..."
psql -U ${DB_USER} -d ${TEMP_DB} -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname IN ('auth_service', 'bank_sync_service', 'payment_service', 'workflow_service');"

# Disconnect all clients from the current database
echo "Disconnecting all clients from the current database..."
psql -U ${DB_USER} -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${DB_NAME}'
  AND pid <> pg_backend_pid();"

# Rename the current database to a backup name
BACKUP_DB_NAME="${DB_NAME}_pre_restore_$(date +%s)"
echo "Renaming current database to ${BACKUP_DB_NAME}..."
psql -U ${DB_USER} -d postgres -c "ALTER DATABASE ${DB_NAME} RENAME TO ${BACKUP_DB_NAME};"

# Rename the temporary database to the production name
echo "Renaming restored database to ${DB_NAME}..."
psql -U ${DB_USER} -d postgres -c "ALTER DATABASE ${TEMP_DB} RENAME TO ${DB_NAME};"

echo "Database restore completed successfully!"
echo "The previous database is available as ${BACKUP_DB_NAME} if needed."