# CollectionCRM Database Initialization

This directory contains SQL scripts for initializing the CollectionCRM database schema. The schema is designed for PostgreSQL 13 or higher and is organized into four service-specific schemas:

1. `auth_service` - Authentication and authorization related tables
2. `bank_sync_service` - Customer and loan-related tables synchronized from external systems
3. `payment_service` - Payment-related tables
4. `workflow_service` - Collection workflow-related tables including agents, actions, and cases

## Directory Structure

The database files are organized as follows:

- `init/` - Contains all SQL initialization scripts
  - `00-init-db.sql` - Main initialization script that runs all the SQL scripts in the correct order
  - `scripts/` - Directory containing the actual SQL scripts
    - `00-common.sql` - Extensions, schemas, and common types
    - `01-auth-service.sql` - Auth service schema tables and indexes
    - `02-bank-sync-service.sql` - Bank sync service schema tables and indexes
    - `03-payment-service.sql` - Payment service schema tables, indexes, partitions, and materialized views
    - `04-workflow-service.sql` - Workflow service schema tables, indexes, partitions, and materialized views
    - `05-functions-triggers.sql` - Additional functions and triggers for database maintenance and automation
    - `06-users-permissions.sql` - Users and permissions
- `backup/` - Contains backup scripts and backup files
- `00-restore-latest-backup.sh` - Script to restore from the latest backup when PostgreSQL container starts

## Key Features

The database schema includes the following key features:

1. **Partitioning for High-Volume Tables**:
   - `payment_service.payments` - Partitioned by payment date
   - `workflow_service.action_records` - Partitioned by action date
   - `workflow_service.customer_agents` - Partitioned by start date

2. **Materialized Views for Reporting**:
   - `payment_service.payment_summary` - Payment summary metrics
   - `payment_service.payment_method_analysis` - Payment method analysis
   - `workflow_service.agent_performance` - Agent performance metrics
   - `workflow_service.customer_collection_status` - Customer collection status summary

3. **Functions and Triggers**:
   - Automatic updating of `updated_at` timestamps
   - Functions for creating new partitions
   - Functions for refreshing materialized views
   - Trigger for maintaining customer agent assignment history

## Installation

To initialize the database schema, follow these steps:

1. Create a new PostgreSQL database:
   ```bash
   createdb -U postgres collectioncrm
   ```

2. Run the main initialization script:
   ```bash
   cd infrastructure/database/init
   psql -U postgres -d collectioncrm -f 00-init-db.sql
   ```

## Automatic Restore from Backup

When using Docker, the database can be automatically restored from the latest backup when first initialized:

1. The `00-restore-latest-backup.sh` script runs first and checks for a backup at `/backup/latest_backup.pgdump`
2. If a backup is found, it restores the database and skips the regular initialization scripts
3. If no backup is found or the restore fails, the regular initialization scripts run

You can control this behavior using the `AUTO_RESTORE_ON_INIT` environment variable in `docker/config/postgres.env`:
- Set to `true` (default): Enables automatic restore on first run
- Set to `false`: Disables automatic restore

## Maintenance Tasks

### Creating New Partitions

As time progresses, you'll need to create new partitions for the partitioned tables. Use the provided functions:

```sql
-- For payments table
SELECT payment_service.create_payments_partition(2026, 1);  -- Year 2026, Q1

-- For action_records table
SELECT workflow_service.create_action_records_partition(2026, 1);  -- Year 2026, Q1

-- For customer_agents table
SELECT workflow_service.create_customer_agents_partition(2026, 1);  -- Year 2026, Q1
```

### Refreshing Materialized Views

To refresh all materialized views:

```sql
SELECT schedule_materialized_view_refreshes();
```

Or refresh specific service views:

```sql
SELECT payment_service.refresh_payment_materialized_views();
SELECT workflow_service.refresh_workflow_materialized_views();
```

## Schema Diagram

For a visual representation of the database schema, refer to the entity-relationship diagram in `docs/database/database-schema-implementation.md`.