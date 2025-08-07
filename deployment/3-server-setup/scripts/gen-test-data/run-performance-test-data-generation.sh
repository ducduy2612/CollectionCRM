#!/bin/bash

# =============================================
# CollectionCRM Performance Test Data Generation
# Master script to generate and load test data
# =============================================

set -e  # Exit on error

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-collectioncrm}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-admin_password}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} WARNING: $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ERROR: $1"
}

# Function to execute SQL file
execute_sql() {
    local sql_file=$1
    local description=$2
    
    print_status "Executing: $description"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$sql_file"
    
    if [ $? -eq 0 ]; then
        print_status "Successfully completed: $description"
    else
        print_error "Failed to execute: $description"
        exit 1
    fi
}

# Function to check disk space
check_disk_space() {
    local required_gb=5  # Estimated space needed in GB
    local available_gb=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    
    if [ "$available_gb" -lt "$required_gb" ]; then
        print_error "Insufficient disk space. Required: ${required_gb}GB, Available: ${available_gb}GB"
        exit 1
    fi
    
    print_status "Disk space check passed. Available: ${available_gb}GB"
}

# Main execution
main() {
    print_status "Starting CollectionCRM Performance Test Data Generation"
    print_status "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    
    # Test database connection
    print_status "Testing database connection..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_error "Failed to connect to database. Please check your credentials and connection settings."
        exit 1
    fi
    
    # Check disk space
    check_disk_space
    
    # Check if staging_bank schema already exists and has data
    print_status "Checking existing staging_bank schema..."
    existing_count=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'staging_bank'")
    
    if [ "$existing_count" -gt 0 ]; then
        print_warning "staging_bank schema already exists with $existing_count tables"
        read -p "Do you want to regenerate all test data? This will take considerable time. (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping data generation, proceeding to load existing staging data..."
            SKIP_GENERATION=true
        fi
    fi
    
    # Select scale for data generation
    if [ "$SKIP_GENERATION" != "true" ]; then
        print_status "Select data generation scale:"
        print_status "  1) small   - 1K customers, 3K loans (< 1 minute)"
        print_status "  2) medium  - 10K customers, 30K loans (1-5 minutes)"
        print_status "  3) large   - 100K customers, 300K loans (5-15 minutes)"
        print_status "  4) xlarge  - 1M customers, 3M loans (30-60 minutes)"
        
        read -p "Enter your choice (1-4) [default: 1]: " -n 1 -r scale_choice
        echo
        
        case $scale_choice in
            1) SCALE="small" ;;
            2) SCALE="medium" ;;
            3) SCALE="large" ;;
            4) SCALE="xlarge" ;;
            *) SCALE="small" ;;
        esac
        
        print_status "Selected scale: $SCALE"
    fi
    
    # Generate test data in staging_bank schema
    if [ "$SKIP_GENERATION" != "true" ]; then
        case $SCALE in
            small)
                print_status "Starting SMALL scale test data generation..."
                print_status "Generating:"
                print_status "  - 1,000 customers"
                print_status "  - 3,000 loans"
                print_status "  - 1,000 reference customers"
                ;;
            medium)
                print_status "Starting MEDIUM scale test data generation..."
                print_status "Generating:"
                print_status "  - 10,000 customers"
                print_status "  - 30,000 loans"
                print_status "  - 10,000 reference customers"
                ;;
            large)
                print_status "Starting LARGE scale test data generation..."
                print_status "Generating:"
                print_status "  - 100,000 customers"
                print_status "  - 300,000 loans"
                print_status "  - 100,000 reference customers"
                ;;
            xlarge)
                print_status "Starting XLARGE scale test data generation..."
                print_status "Generating:"
                print_status "  - 1,000,000 customers"
                print_status "  - 3,000,000 loans"
                print_status "  - 1,000,000 reference customers"
                ;;
        esac
        
        START_TIME=$(date +%s)
        # Pass the scale setting to PostgreSQL
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SET myapp.scale = '$SCALE';" -f "generate-test-data.sql"
        if [ $? -eq 0 ]; then
            print_status "Successfully completed: Test data generation"
        else
            print_error "Failed to execute: Test data generation"
            exit 1
        fi
        END_TIME=$(date +%s)
        
        DURATION=$((END_TIME - START_TIME))
        print_status "Data generation completed in $((DURATION / 60)) minutes and $((DURATION % 60)) seconds"
    fi
    
    # Ask before loading to production schema
    print_warning "The next step will TRUNCATE all data in bank_sync_service schema!"
    read -p "Do you want to load test data into bank_sync_service schema? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Loading data from staging_bank to bank_sync_service..."
        
        START_TIME=$(date +%s)
        execute_sql "load-test-data-from-staging.sql" "Loading test data"
        END_TIME=$(date +%s)
        
        DURATION=$((END_TIME - START_TIME))
        print_status "Data loading completed in $((DURATION / 60)) minutes and $((DURATION % 60)) seconds"
        
        # Show final statistics
        print_status "Fetching final row counts..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT 'bank_sync_service.' || table_name as table_full_name, 
               to_char(row_count, 'FM999,999,999') as formatted_count
        FROM (
            SELECT 'customers' as table_name, COUNT(*) as row_count FROM bank_sync_service.customers
            UNION ALL SELECT 'loans', COUNT(*) FROM bank_sync_service.loans
            UNION ALL SELECT 'reference_customers', COUNT(*) FROM bank_sync_service.reference_customers
            UNION ALL SELECT 'collaterals', COUNT(*) FROM bank_sync_service.collaterals
            UNION ALL SELECT 'phones', COUNT(*) FROM bank_sync_service.phones
            UNION ALL SELECT 'addresses', COUNT(*) FROM bank_sync_service.addresses
            UNION ALL SELECT 'emails', COUNT(*) FROM bank_sync_service.emails
            UNION ALL SELECT 'due_segmentations', COUNT(*) FROM bank_sync_service.due_segmentations
            UNION ALL SELECT 'loan_collaterals', COUNT(*) FROM bank_sync_service.loan_collaterals
            UNION ALL SELECT 'loan_custom_fields', COUNT(*) FROM bank_sync_service.loan_custom_fields
        ) t
        ORDER BY 
            CASE table_name 
                WHEN 'customers' THEN 1
                WHEN 'loans' THEN 2
                WHEN 'reference_customers' THEN 3
                ELSE 4
            END;"
        
        print_status "Performance test data has been successfully loaded!"
        print_status "You can now run performance tests against the bank_sync_service schema."
    else
        print_status "Data loading cancelled. Test data remains in staging_bank schema."
    fi
}

# Run main function
main