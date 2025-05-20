#!/bin/bash
# Script to dump only the data from bank_sync_service schema tables

# Load environment variables if available
if [ -f "docker/config/postgres.env" ]; then
  source docker/config/postgres.env
fi

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="./data_dumps"
OUTPUT_FILE="${OUTPUT_DIR}/bank_sync_service_data_${TIMESTAMP}.sql"

# Database connection details
DB_NAME=${POSTGRES_DB:-collectioncrm}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_USER=${BANK_SYNC_SERVICE_USER:-bank_sync_user}
DB_PASSWORD=${BANK_SYNC_SERVICE_PASSWORD:-bank_sync_password}

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Create output directory if it doesn't exist
mkdir -p ${OUTPUT_DIR}

# Export PGPASSWORD for passwordless connection
export PGPASSWORD="${DB_PASSWORD}"

log "Starting data dump of bank_sync_service schema to ${OUTPUT_FILE}"

# Use pg_dump to dump only the data from bank_sync_service schema
# --schema=bank_sync_service: Only dump the bank_sync_service schema
# --data-only: Only dump the data, not the schema structure
# --column-inserts: Use INSERT with column names
# --no-owner: Don't include commands to set ownership
pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} \
  --schema=bank_sync_service \
  --data-only \
  --column-inserts \
  --no-owner \
  > ${OUTPUT_FILE}

# Check if the dump was successful
if [ $? -eq 0 ]; then
  log "Data dump completed successfully: ${OUTPUT_FILE}"
  # Set appropriate permissions
  chmod 640 ${OUTPUT_FILE}
  
  # Show file size
  du -h ${OUTPUT_FILE}
  
  echo "You can restore this data using:"
  echo "psql -h \${DB_HOST} -p \${DB_PORT} -U \${DB_USER} -d \${DB_NAME} -f ${OUTPUT_FILE}"
else
  log "ERROR: Data dump failed!"
fi

# Unset PGPASSWORD for security
unset PGPASSWORD

log "Process completed"