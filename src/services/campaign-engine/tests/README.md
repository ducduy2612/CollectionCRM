# Campaign-Engine Test Suite

This directory contains comprehensive test data and scripts for testing the Campaign-Engine ProcessingService.

## Directory Structure

```
tests/
├── README.md                           # This file
├── processing-service.test.js          # Jest test suite
├── test-summary-and-manual-validation.md # Test documentation
├── data/                               # Test data SQL files
│   ├── test-data-bank-sync-insert.sql      # Bank-sync service test data
│   ├── test-data-workflow-insert.sql       # Workflow service test data
│   ├── test-campaign-config-insert.sql     # Campaign configuration test data
│   └── cleanup-test-data.sql               # Cleanup script
└── scripts/                           # Test runner scripts
    ├── setup-test-data.sql                 # Complete setup script
    ├── quick-test-processing.js            # Quick manual test
    └── test-processing-service.js          # Full test runner
```

## Test Data Overview

### 📊 Test Data Summary
- **15 customers** with varied segments (RETAIL, PREMIUM, SME, CORPORATE)
- **17 loans** with different DPD levels (0-90+ days) and outstanding amounts
- **10 agents** across different teams (EARLY_STAGE, HIGH_RISK, RECOVERY, PREMIUM)
- **8 campaigns** in 3 campaign groups with complex conditions
- **Multiple contact sources** (bank-sync + workflow) with realistic data

### 🎯 Campaign Groups & Campaigns

#### 1. TEST_High_Risk_Collections
- **Critical DPD Campaign** (max_dpd > 60) - Excludes family contacts
- **High Risk Score Campaign** (risk_score >= 8) - Excludes casual relationships
- **Large Outstanding Campaign** (client_outstanding > 100K) - Multi-tier rules

#### 2. TEST_Early_Stage_Recovery
- **Early DPD Campaign** (15 <= max_dpd <= 30) - Excludes work contacts
- **Medium Risk Campaign** (5 <= risk_score <= 7) - SME-specific rules
- **Retail Segment Campaign** (segment = RETAIL, max_dpd > 0) - No contact rules

#### 3. TEST_Premium_Customer_Care
- **Premium Gentle Reminder** (segment = PREMIUM, low DPD) - Customer contacts only
- **VIP Customer Campaign** (premium_customer = true) - Mobile contacts only

## Quick Start

### 1. Setup Test Data
```bash
# From the campaign-engine directory
cd src/services/campaign-engine

# Run the complete setup (if psql is available)
psql -d collectioncrm -f tests/scripts/setup-test-data.sql

# OR run individual files with Docker
cat tests/data/test-data-bank-sync-insert.sql | docker compose -f ../../../docker/compose/docker-compose.dev.yml exec -T postgres psql -U postgres -d collectioncrm
cat tests/data/test-data-workflow-insert.sql | docker compose -f ../../../docker/compose/docker-compose.dev.yml exec -T postgres psql -U postgres -d collectioncrm
cat tests/data/test-campaign-config-insert.sql | docker compose -f ../../../docker/compose/docker-compose.dev.yml exec -T postgres psql -U postgres -d collectioncrm
```

### 2. Run Tests

#### Jest Test Suite (Automated)
```bash
npm test -- --testPathPattern=processing-service.test.js --verbose
```

#### Quick Manual Test
```bash
node tests/scripts/quick-test-processing.js
```

#### Full Test Runner
```bash
node tests/scripts/test-processing-service.js
```

### 3. Verify Test Data
```sql
-- Check customer distribution
SELECT 
    segment, 
    COUNT(*) as customers,
    AVG(client_outstanding) as avg_outstanding,
    MAX(max_dpd) as max_dpd_in_segment
FROM bank_sync_service.loan_campaign_data 
WHERE cif LIKE 'TEST%' 
GROUP BY segment;

-- Check campaign configuration
SELECT 
    cg.name as group_name, 
    c.name as campaign_name, 
    c.priority 
FROM campaign_engine.campaign_groups cg 
JOIN campaign_engine.campaigns c ON cg.id = c.campaign_group_id 
WHERE cg.name LIKE 'TEST_%' 
ORDER BY cg.name, c.priority;
```

### 4. Cleanup (When Done)
```bash
psql -d collectioncrm -f tests/data/cleanup-test-data.sql

# OR with Docker
cat tests/data/cleanup-test-data.sql | docker compose -f ../../../docker/compose/docker-compose.dev.yml exec -T postgres psql -U postgres -d collectioncrm
```

## Test Scenarios Covered

### ✅ **Campaign Processing Features**
- Campaign priority ordering within groups
- Customer assignment exclusions (no duplicates within same group)
- Contact selection rules with relationship/type filtering
- Custom field conditions (JSONB queries)
- Performance metrics collection
- Error handling for edge cases

### ✅ **Data Compliance**
- All ENUM types properly used (customer_type, source_system, loan_status)
- Foreign key relationships maintained
- Realistic data distributions and patterns

### ✅ **Contact Selection Rules**
- Family relationship exclusions for aggressive campaigns
- Work contact exclusions for gentle approaches
- Customer-only contacts for premium services
- Mobile-only contacts for VIP privacy
- Multi-tier exclusion rules

## Expected Test Results

### High DPD Targeting
- **TEST003** (90 DPD), **TEST002** (60 DPD) should be targeted by Critical DPD Campaign

### Risk-Based Targeting  
- Customers with risk_score >= 8 should be targeted by High Risk Score Campaign
- Customers with 5 <= risk_score <= 7 should be targeted by Medium Risk Campaign

### Segment Targeting
- PREMIUM customers should be handled by Premium Customer Care campaigns
- RETAIL customers should be processed by Early Stage Recovery

### Contact Exclusions
- Family contacts excluded for high-risk campaigns
- Work contacts excluded for early-stage campaigns
- Reference contacts excluded for premium campaigns

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **Cache Issues**: Clear Redis cache if configuration changes aren't reflected
3. **Foreign Key Errors**: Ensure test data is loaded in the correct order
4. **JSON Parsing Errors**: Check that relationship_patterns are properly formatted as JSONB

### Debug Commands
```bash
# Check campaign-engine logs
docker compose -f docker/compose/docker-compose.dev.yml logs --tail=20 campaign-engine

# Clear Redis cache
docker compose -f docker/compose/docker-compose.dev.yml exec -T redis redis-cli DEL campaign-configuration

# Test API endpoints
curl -s "http://localhost:3004/api/v1/campaigns/groups" | jq '.'
curl -s "http://localhost:3004/health"
```

## Contributing

When adding new test scenarios:
1. Add test data to appropriate files in `data/` directory
2. Update campaign configuration if needed
3. Add corresponding test cases to Jest suite
4. Update this README with new test scenarios
5. Ensure cleanup script handles new test data

## Performance Notes

- Test data is designed to be lightweight but comprehensive
- Materialized views should be refreshed after data changes
- Use indexed queries where possible for better performance
- Monitor database query performance during tests