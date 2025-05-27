# Database Initialization Scripts

This directory contains the SQL initialization scripts for the CollectionCRM database. These scripts are organized to work both locally and in Docker environments.

## Directory Structure

- `00-init-db.sql` - Main initialization script that runs all the SQL scripts in the correct order
- `scripts/` - Directory containing the actual SQL scripts
  - `00-common.sql` - Extensions, schemas, and common types
  - `01-auth-service.sql` - Auth service schema tables and indexes
  - `02-bank-sync-service.sql` - Bank sync service schema tables and indexes
  - `03-payment-service.sql` - Payment service schema tables, indexes, partitions, and materialized views
  - `04-workflow-service.sql` - Workflow service schema tables, indexes, partitions, and materialized views
  - `05-functions-triggers.sql` - Additional functions and triggers for database maintenance and automation
  - `06-users-permissions.sql` - Users and permissions

## Usage

### Local Initialization

To initialize the database locally:

```bash
cd infrastructure/database/init
psql -U postgres -d collectioncrm -f 00-init-db.sql
```

### Docker Initialization

In Docker, these scripts are mounted to `/docker-entrypoint-initdb.d/init` and will be executed automatically when the container starts, unless a successful database restore from backup occurs first.

The restore script (`00-restore-latest-backup.sh`) runs before these initialization scripts and will skip them if a successful restore is performed.

### Execution Order

The execution order is carefully controlled:

1. First, `00-restore-latest-backup.sh` runs and attempts to restore from backup
2. If the restore fails or is disabled, `00-init-db.sql` runs next
3. `00-init-db.sql` then includes all the SQL scripts from the `scripts/` directory in the correct order

This structure ensures that SQL scripts are not executed directly by the Docker entrypoint, preventing duplicate schema creation.