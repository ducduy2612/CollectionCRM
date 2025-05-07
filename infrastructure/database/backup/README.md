# CollectionCRM Database Backup and Restore

This directory contains scripts for automated database backups and restoration procedures for the CollectionCRM PostgreSQL database.

## Backup Strategy

The backup system implements a comprehensive backup strategy with:

1. **Daily Backups**: Created every day at 2:00 AM, retained for 30 days by default
2. **Weekly Backups**: Created every Sunday, retained for 3 months
3. **Monthly Backups**: Created on the 1st of each month, retained for 1 year

All backups are compressed using PostgreSQL's native compression to save disk space.

## Backup Scripts

- `pg_backup.sh`: Main backup script that creates compressed backups
- `pg_restore.sh`: Script for restoring from backups
- `setup_cron.sh`: Script to set up automated backup schedule

## Configuration

Backup configuration is controlled through environment variables in `docker/config/postgres.env`:

- `BACKUP_RETENTION_DAYS`: Number of days to retain daily backups (default: 30)
- `BACKUP_COMPRESSION_LEVEL`: Compression level for backups (default: 9, max compression)

## Backup Directory Structure

```
/backup/
├── daily/           # Daily backups
├── weekly/          # Weekly backups (Sundays)
├── monthly/         # Monthly backups (1st of month)
├── backup.log       # Backup logs
└── latest_backup.pgdump  # Symlink to latest backup
```

## Running Manual Backups

To run a manual backup:

```bash
docker exec -it collectioncrm_postgres /backup/pg_backup.sh
```

## Restoring from Backup

To restore from the latest backup:

```bash
docker exec -it collectioncrm_postgres /backup/pg_restore.sh --latest
```

To restore from a specific backup file:

```bash
docker exec -it collectioncrm_postgres /backup/pg_restore.sh --file /backup/daily/collectioncrm_daily_20250505_120000.pgdump
```

## Monitoring Backups

Backup logs are written to `/backup/backup.log`. You can monitor the success of backups by checking this file:

```bash
docker exec -it collectioncrm_postgres tail -n 50 /backup/backup.log
```

## Backup Verification

It's recommended to periodically verify backups by restoring them to a test environment. This can be done by:

1. Creating a separate test PostgreSQL instance
2. Using the `pg_restore.sh` script to restore to this test instance
3. Running validation queries to ensure data integrity

## Disaster Recovery

In case of a database failure:

1. Stop the PostgreSQL container
2. Start a new PostgreSQL container with the same volume mounts
3. Use the `pg_restore.sh` script to restore from the latest backup
4. Verify the restored database by connecting to it and running validation queries