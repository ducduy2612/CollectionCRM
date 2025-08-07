# Performance Test Data Generation Scripts

This directory contains scripts to generate realistic test data for performance testing of the CollectionCRM system.

## Overview

The scripts support multiple scale configurations:

| Scale | Customers | Reference Customers | Loans | Generation Time |
|-------|-----------|-------------------|-------|-----------------|
| **small** | 1,000 | 1,000 | 3,000 | < 1 minute |
| **medium** | 10,000 | 10,000 | 30,000 | 1-5 minutes |
| **large** | 100,000 | 100,000 | 300,000 | 5-15 minutes |
| **xlarge** | 1,000,000 | 1,000,000 | 3,000,000 | 30-60 minutes |

Each scale also generates:
- Complete contact information (phones, addresses, emails) for all customers and reference customers
- ~30% of loans with collaterals
- ~30% of loans with overdue status and due segmentations
- Loan custom fields with risk scores and collection priorities

## Scripts

1. **`generate-test-data.sql`** - Main SQL script that creates the staging_bank schema and generates all test data (configurable scale)
2. **`generate-test-data-{small,medium,large,xlarge}.sql`** - Convenience scripts for specific scales
3. **`load-test-data-from-staging.sql`** - SQL script to copy data from staging_bank to bank_sync_service schema
4. **`run-performance-test-data-generation.sh`** - Master bash script that orchestrates the entire process with interactive scale selection

## Usage

### Quick Start

```bash
cd infrastructure/database/scripts
./run-performance-test-data-generation.sh
# You'll be prompted to select a scale (1-4)
```

### Manual Execution

If you prefer to run the scripts manually:

1. Generate test data in staging schema with specific scale:
```bash
# Option 1: Use scale-specific scripts
psql -U postgres -d collectioncrm -f generate-test-data-small.sql   # 1K customers
psql -U postgres -d collectioncrm -f generate-test-data-medium.sql  # 10K customers
psql -U postgres -d collectioncrm -f generate-test-data-large.sql   # 100K customers
psql -U postgres -d collectioncrm -f generate-test-data-xlarge.sql  # 1M customers

# Option 2: Set scale manually
psql -U postgres -d collectioncrm -c "SET myapp.scale = 'medium';" -f generate-test-data.sql
```

2. Load data into production schema (WARNING: This truncates existing data!):
```bash
psql -U postgres -d collectioncrm -f load-test-data-from-staging.sql
```

### Docker Execution

From inside the PostgreSQL container:
```bash
docker compose -f docker/compose/docker-compose.dev.yml exec postgres bash
cd /scripts

# Run with scale selection
./run-performance-test-data-generation.sh

# Or run specific scale directly
psql -U postgres -d collectioncrm -f generate-test-data-small.sql
```

### Environment Variables

The master script uses these environment variables (with defaults):
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_NAME` (default: collectioncrm)
- `DB_USER` (default: postgres)
- `DB_PASSWORD` (default: postgres)

Example with custom settings:
```bash
DB_HOST=mydb.example.com DB_PASSWORD=mysecret ./run-performance-test-data-generation.sh
```

## Data Characteristics

### Customer Distribution
- 80% Individual customers, 20% Organizations
- Segments: RETAIL, SME, CORPORATE, PRIORITY, MASS
- Realistic Vietnamese names and addresses
- Major cities: Ho Chi Minh City, Hanoi, Da Nang, Can Tho, Hai Phong

### Loan Distribution
- Product types: PERSONAL_LOAN, AUTO_LOAN, MORTGAGE, CREDIT_CARD, BUSINESS_LOAN
- DPD (Days Past Due) distribution:
  - 70% current (DPD = 0)
  - 15% slightly overdue (1-30 days)
  - 10% moderately overdue (31-90 days)
  - 5% severely overdue (90+ days)
- 90% open loans, 10% closed loans
- Loan amounts: 10M to 1B VND

### Reference Customers
- Relationship types: SPOUSE, PARENT, SIBLING, CHILD, GUARANTOR, CO_BORROWER, etc.
- 90% individuals, 10% organizations
- Linked to primary customers

## Performance Considerations

- Data generation takes approximately 30-60 minutes depending on hardware
- Requires ~50GB of free disk space
- Indexes are created after data insertion for better performance
- The script uses PostgreSQL's COPY command internally for bulk loading
- Foreign key checks are temporarily disabled during loading

## Staging Schema

All test data is first generated in the `staging_bank` schema. This allows you to:
- Generate data once and load multiple times
- Inspect data before loading to production schema
- Keep test data separate from production data

## Safety Features

- The master script prompts for confirmation before:
  - Regenerating existing test data
  - Loading data into bank_sync_service (which truncates existing data)
- Disk space is checked before generation
- Database connection is verified before starting
- All operations are wrapped in transactions

## Troubleshooting

1. **Out of disk space**: The scripts require ~50GB free space. Clean up old data or increase disk space.

2. **Slow generation**: 
   - Ensure PostgreSQL has adequate memory settings
   - Consider running during off-peak hours
   - The script shows progress every 10,000 records

3. **Foreign key errors**: 
   - The load script temporarily disables FK checks
   - If errors persist, check data integrity in staging_bank schema

4. **Connection errors**:
   - Verify database credentials
   - Check PostgreSQL is running and accepting connections
   - Ensure user has necessary permissions

## Cleanup

To remove test data:
```sql
-- Remove staging schema completely
DROP SCHEMA staging_bank CASCADE;

-- Or just truncate bank_sync_service tables
TRUNCATE TABLE bank_sync_service.customers CASCADE;
```