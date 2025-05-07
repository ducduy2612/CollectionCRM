#!/bin/bash
# Setup cron jobs for PostgreSQL database backups

# Create a crontab entry for daily backups at 2:00 AM
CRON_JOB="0 2 * * * /backup/pg_backup.sh >> /backup/backup.log 2>&1"

# Add the cron job
(crontab -l 2>/dev/null || echo "") | grep -v "pg_backup.sh" | { cat; echo "$CRON_JOB"; } | crontab -

echo "Cron job for daily backups has been set up to run at 2:00 AM."
echo "Backup logs will be written to /backup/backup.log"