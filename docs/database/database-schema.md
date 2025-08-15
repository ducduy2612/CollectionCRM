# Database Schema Design

This document outlines the physical database schema for the Collexis system, mapping the logical data model to database tables with appropriate optimizations.

## Schema Organization for Microservices Architecture

The database schema is organized into separate schemas that align with the microservices architecture of the Collexis system. This organization provides several benefits:

1. **Clear Domain Boundaries**: Each schema corresponds to a specific microservice domain, making it easier to understand which tables belong to which service.

2. **Improved Security**: Schema-level permissions can be applied to restrict access to specific domains.

3. **Future Isolation**: This organization supports future isolation into separate databases per microservice. As the system grows, each schema can be migrated to its own database instance without changing the application logic.

4. **Independent Evolution**: Each microservice team can manage their schema independently, reducing coordination overhead.

The following schemas are defined:

- **auth_service**: Authentication and authorization related tables (not detailed in this document)
- **bank_sync_service**: Customer and loan-related tables synchronized from external systems
- **payment_service**: Payment-related tables
- **workflow_service**: Collection workflow-related tables including agents, actions, and cases

## Table Definitions

### SynchronizedEntity Base Fields

These fields are included in all tables that represent synchronized entities:

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| id | UUID | Primary key |
| source_system | VARCHAR(10) | Origin system (T24, W4, OTHER, CRM) |
| created_by | VARCHAR(50) | User/system that created |
| updated_by | VARCHAR(50) | User/system that last updated |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| is_editable | BOOLEAN | Whether record can be modified |
| last_synced_at | TIMESTAMP | Last synchronization timestamp |

### bank_sync_service.customers

Stores information about individual and organizational customers.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| cif | VARCHAR(20) | UNIQUE | Customer identification number (natural key) |
| type | VARCHAR(20) | NOT NULL | Customer type (INDIVIDUAL or ORGANIZATION) |
| name | VARCHAR(100) | | Individual's name |
| date_of_birth | DATE | | Individual's date of birth |
| national_id | VARCHAR(20) | | National ID number |
| gender | VARCHAR(10) | | Gender |
| company_name | VARCHAR(100) | | Organization's name |
| registration_number | VARCHAR(20) | | Organization's registration number |
| tax_id | VARCHAR(20) | | Tax ID |
| segment | VARCHAR(50) | NOT NULL | Customer segment |
| status | VARCHAR(10) | NOT NULL | Status (ACTIVE or INACTIVE) |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `cif`
- Index: `national_id`
- Index: `registration_number`
- Index: `segment`
- Index: `status`
- Index: `type`

### bank_sync_service.phones

Stores phone numbers associated with customers.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| type | VARCHAR(20) | NOT NULL | Phone type (MOBILE, HOME, WORK, etc.) |
| number | VARCHAR(20) | NOT NULL | Phone number |
| is_primary | BOOLEAN | NOT NULL | Whether this is the primary phone |
| is_verified | BOOLEAN | NOT NULL | Whether this phone is verified |
| verification_date | TIMESTAMP | | When the phone was verified |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `(cif, type)`
- Index: `number`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`

### bank_sync_service.addresses

Stores physical addresses associated with customers.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| type | VARCHAR(20) | NOT NULL | Address type (HOME, WORK, BILLING, etc.) |
| address_line1 | VARCHAR(100) | NOT NULL | Address line 1 |
| address_line2 | VARCHAR(100) | | Address line 2 |
| city | VARCHAR(50) | NOT NULL | City |
| state | VARCHAR(50) | NOT NULL | State/Province |
| district | VARCHAR(50) | NOT NULL | District |
| country | VARCHAR(50) | NOT NULL | Country |
| is_primary | BOOLEAN | NOT NULL | Whether this is the primary address |
| is_verified | BOOLEAN | NOT NULL | Whether this address is verified |
| verification_date | TIMESTAMP | | When the address was verified |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `(cif, type)`
- Index: `city`
- Index: `state`
- Index: `country`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`

### bank_sync_service.emails

Stores email addresses associated with customers.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| address | VARCHAR(100) | NOT NULL | Email address |
| is_primary | BOOLEAN | NOT NULL | Whether this is the primary email |
| is_verified | BOOLEAN | NOT NULL | Whether this email is verified |
| verification_date | TIMESTAMP | | When the email was verified |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `(cif, address)`
- Index: `address`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`

### bank_sync_service.loans

Stores information about loans issued to customers.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| account_number | VARCHAR(20) | UNIQUE, NOT NULL | Loan account number (natural key) |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| product_type | VARCHAR(20) | NOT NULL | Loan product type |
| original_amount | DECIMAL(18,2) | NOT NULL | Original loan amount |
| currency | VARCHAR(3) | NOT NULL | Currency code |
| disbursement_date | DATE | NOT NULL | Disbursement date |
| maturity_date | DATE | NOT NULL | Maturity date |
| interest_rate | DECIMAL(8,4) | NOT NULL | Interest rate |
| term | INTEGER | NOT NULL | Loan term in months |
| payment_frequency | VARCHAR(20) | NOT NULL | Payment frequency |
| limit | DECIMAL(18,2) | | Limit of OD & Cards |
| outstanding | DECIMAL(18,2) | NOT NULL | Current outstanding balance |
| remaining_amount | DECIMAL(18,2) | NOT NULL | Remaining amount |
| due_amount | DECIMAL(18,2) | NOT NULL | Current due amount |
| min_pay | DECIMAL(18,2) | | For cards product |
| next_payment_date | DATE | NOT NULL | Next payment date |
| dpd | INTEGER | NOT NULL | Days past due |
| delinquency_status | VARCHAR(20) | NOT NULL | Delinquency status |
| status | VARCHAR(10) | NOT NULL | Loan status (OPEN or CLOSED) |
| close_date | DATE | | Loan close date |
| resolution_code | VARCHAR(20) | | Resolution code |
| resolution_notes | TEXT | | Resolution notes |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `account_number`
- Index: `cif`
- Index: `product_type`
- Index: `status`
- Index: `dpd`
- Index: `delinquency_status`
- Index: `next_payment_date`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`

### bank_sync_service.collaterals

Stores information about assets used as collateral for loans.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| collateral_number | VARCHAR(20) | UNIQUE, NOT NULL | Collateral number (natural key) |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| type | VARCHAR(20) | NOT NULL | Collateral type |
| description | TEXT | NOT NULL | Description |
| value | DECIMAL(18,2) | NOT NULL | Assessed value |
| valuation_date | DATE | NOT NULL | Valuation date |
| make | VARCHAR(50) | | Vehicle make |
| model | VARCHAR(50) | | Vehicle model |
| year | INTEGER | | Vehicle year |
| vin | VARCHAR(20) | | Vehicle identification number |
| license_plate | VARCHAR(20) | | License plate |
| property_type | VARCHAR(20) | | Property type |
| address | TEXT | | Property address |
| size | DECIMAL(10,2) | | Property size |
| title_number | VARCHAR(20) | | Title number |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `collateral_number`
- Index: `cif`
- Index: `type`
- Index: `vin`
- Index: `license_plate`
- Index: `title_number`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`

### workflow_service.action_records

Stores actions taken by collection agents.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| loan_account_number | VARCHAR(20) | FK, NOT NULL | Reference to loan's account number |
| agent_id | UUID | FK, NOT NULL | Reference to agent's ID |
| type | VARCHAR(20) | NOT NULL | Action type |
| subtype | VARCHAR(30) | NOT NULL | Action subtype |
| action_result | VARCHAR(30) | NOT NULL | Action result |
| action_date | TIMESTAMP | NOT NULL | When the action occurred |
| notes | TEXT | | Action notes |
| call_trace_id | VARCHAR(20) | | Call trace ID in call centers |
| visit_latitude | DECIMAL(10,8) | | Visit location latitude |
| visit_longitude | DECIMAL(11,8) | | Visit location longitude |
| visit_address | TEXT | | Visit address |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | VARCHAR(50) | NOT NULL | User who created this action |
| updated_by | VARCHAR(50) | NOT NULL | User who last updated this action |

**Indexes:**
- Primary Key: `id`
- Index: `cif`
- Index: `loan_account_number`
- Index: `agent_id`
- Index: `type`
- Index: `action_date`
- Index: `action_result`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`
- Foreign Key: `loan_account_number` references `bank_sync_service.loans(account_number)`
- Foreign Key: `agent_id` references `workflow_service.agents(id)`

### workflow_service.agents

Stores information about collection agents and their teams.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| employee_id | VARCHAR(20) | UNIQUE, NOT NULL | Employee ID |
| name | VARCHAR(100) | NOT NULL | Agent name |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Work email |
| phone | VARCHAR(20) | | Work phone |
| type | VARCHAR(20) | NOT NULL | Agent type (AGENT, SUPERVISOR, ADMIN) |
| team | VARCHAR(30) | NOT NULL | Team assignment |
| is_active | BOOLEAN | NOT NULL | Whether agent is active |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `employee_id`
- Unique Index: `email`
- Index: `team`
- Index: `type`
- Index: `is_active`

### payment_service.payments

Stores payments made toward loans.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| reference_number | VARCHAR(20) | UNIQUE, NOT NULL | Reference number (natural key) |
| loan_account_number | VARCHAR(20) | FK, NOT NULL | Reference to loan's account number |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| amount | DECIMAL(18,2) | NOT NULL | Payment amount |
| currency | VARCHAR(3) | NOT NULL | Currency code |
| payment_date | TIMESTAMP | NOT NULL | Payment date |
| payment_method | VARCHAR(20) | NOT NULL | Payment method |
| status | VARCHAR(20) | NOT NULL | Payment status |
| status_reason | TEXT | | Status reason |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `reference_number`
- Index: `loan_account_number`
- Index: `cif`
- Index: `payment_date`
- Index: `status`
- Foreign Key: `loan_account_number` references `bank_sync_service.loans(account_number)`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`

### bank_sync_service.due_segmentations

Stores due segmentation amounts for different due dates for loans.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| loan_account_number | VARCHAR(20) | FK, NOT NULL | Reference to loan's account number |
| due_date | DATE | NOT NULL | Due date |
| principal_amount | DECIMAL(18,2) | NOT NULL | Amount allocated to principal |
| interest_amount | DECIMAL(18,2) | NOT NULL | Amount allocated to interest |
| fees_amount | DECIMAL(18,2) | NOT NULL | Amount allocated to fees |
| penalty_amount | DECIMAL(18,2) | NOT NULL | Amount allocated to penalties |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `(loan_account_number, due_date)`
- Index: `due_date`
- Foreign Key: `loan_account_number` references `bank_sync_service.loans(account_number)`

### bank_sync_service.loan_collaterals

Junction table for the many-to-many relationship between loans and collaterals.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| loan_account_number | VARCHAR(20) | FK, NOT NULL | Reference to loan's account number |
| collateral_number | VARCHAR(20) | FK, NOT NULL | Reference to collateral's number |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| source_system | VARCHAR(10) | NOT NULL | Source system identifier |

**Indexes:**
- Primary Key: `id`
- Unique Index: `(loan_account_number, collateral_number)`
- Foreign Key: `loan_account_number` references `bank_sync_service.loans(account_number)`
- Foreign Key: `collateral_number` references `bank_sync_service.collaterals(collateral_number)`

### workflow_service.customer_agents

Stores the assignment of customers to agents with historical tracking (SCD Type 2).

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| assigned_call_agent_id | UUID | FK | Assigned call agent ID |
| assigned_field_agent_id | UUID | FK | Assigned field agent ID |
| start_date | DATE | NOT NULL | Start date of assignment |
| end_date | DATE | | End date of assignment |
| is_current | BOOLEAN | NOT NULL | Whether this is the current assignment |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Index: `cif`
- Index: `assigned_call_agent_id`
- Index: `assigned_field_agent_id`
- Index: `is_current`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`
- Foreign Key: `assigned_call_agent_id` references `workflow_service.agents(id)`
- Foreign Key: `assigned_field_agent_id` references `workflow_service.agents(id)`

### workflow_service.customer_cases

Stores the current status of customers for strategy allocation.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| cif | VARCHAR(20) | FK, UNIQUE, NOT NULL | Reference to customer's CIF |
| assigned_call_agent_id | UUID | FK | Assigned call agent ID |
| assigned_field_agent_id | UUID | FK | Assigned field agent ID |
| f_update | TIMESTAMP | | Follow-up date |
| customer_status | VARCHAR(30) | NOT NULL | Customer latest status |
| collateral_status | VARCHAR(30) | NOT NULL | Collateral latest status |
| processing_state_status | VARCHAR(30) | NOT NULL | Processing state latest status |
| lending_violation_status | VARCHAR(30) | NOT NULL | Lending violation latest status |
| recovery_ability_status | VARCHAR(30) | NOT NULL | Recovery ability latest status |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `cif`
- Index: `assigned_call_agent_id`
- Index: `assigned_field_agent_id`
- Index: `f_update`
- Index: `customer_status`
- Index: `processing_state_status`
- Index: `recovery_ability_status`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`
- Foreign Key: `assigned_call_agent_id` references `workflow_service.agents(id)`
- Foreign Key: `assigned_field_agent_id` references `workflow_service.agents(id)`

### workflow_service.customer_case_actions

Stores actions and status inputs from agents at the customer level.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| cif | VARCHAR(20) | FK, NOT NULL | Reference to customer's CIF |
| agent_id | UUID | FK, NOT NULL | Reference to agent's ID |
| action_date | TIMESTAMP | NOT NULL | When the action occurred |
| notes | TEXT | | Action notes |
| customer_status | VARCHAR(30) | | Customer status |
| collateral_status | VARCHAR(30) | | Collateral status |
| processing_state_status | VARCHAR(30) | | Processing state status |
| lending_violation_status | VARCHAR(30) | | Lending violation status |
| recovery_ability_status | VARCHAR(30) | | Recovery ability status |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | VARCHAR(50) | NOT NULL | User who created this action |
| updated_by | VARCHAR(50) | NOT NULL | User who last updated this action |

**Indexes:**
- Primary Key: `id`
- Index: `cif`
- Index: `agent_id`
- Index: `action_date`
- Foreign Key: `cif` references `bank_sync_service.customers(cif)`
- Foreign Key: `agent_id` references `workflow_service.agents(id)`

### bank_sync_service.reference_customers

Stores related contacts to customers (such as guarantors, spouses, or other related parties).

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | UUID | PK | Primary key |
| ref_cif | VARCHAR(20) | UNIQUE, NOT NULL | Reference CIF number (natural key) |
| primary_cif | VARCHAR(20) | FK, NOT NULL | Reference to primary customer's CIF |
| relationship_type | VARCHAR(30) | NOT NULL | Relationship to primary customer |
| type | VARCHAR(20) | NOT NULL | Customer type (INDIVIDUAL or ORGANIZATION) |
| name | VARCHAR(100) | | Individual's name |
| date_of_birth | DATE | | Individual's date of birth |
| national_id | VARCHAR(20) | | National ID number |
| gender | VARCHAR(10) | | Gender |
| company_name | VARCHAR(100) | | Organization's name |
| registration_number | VARCHAR(20) | | Organization's registration number |
| tax_id | VARCHAR(20) | | Tax ID |
| source_system | VARCHAR(10) | NOT NULL | Origin system |
| created_by | VARCHAR(50) | NOT NULL | User/system that created |
| updated_by | VARCHAR(50) | NOT NULL | User/system that last updated |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| is_editable | BOOLEAN | NOT NULL | Whether record can be modified |
| last_synced_at | TIMESTAMP | | Last synchronization timestamp |

**Indexes:**
- Primary Key: `id`
- Unique Index: `ref_cif`
- Index: `primary_cif`
- Index: `relationship_type`
- Index: `national_id`
- Index: `registration_number`
- Foreign Key: `primary_cif` references `bank_sync_service.customers(cif)`

## Database Optimization Strategies

### 1. Indexing Strategy

Based on the access patterns identified in the logical data model, the following indexing strategy has been implemented:

1. **Primary Keys**: All tables have UUID primary keys for uniqueness and consistency.
2. **Natural Key Indexes**: Unique indexes on natural business keys (cif, account_number, collateral_number, etc.) to support efficient lookups and maintain data integrity.
3. **Foreign Key Indexes**: Indexes on all foreign key columns to optimize join operations.
4. **Composite Indexes**: Composite indexes for frequently queried combinations (e.g., loan_account_number + due_date).
5. **Search Indexes**: Indexes on columns frequently used in search operations (e.g., customer name, national_id, etc.).
6. **Status Indexes**: Indexes on status columns used for filtering (e.g., loan status, payment status, etc.).

### 2. Partitioning Strategy

For tables expected to grow significantly over time, consider the following partitioning strategies:

1. **workflow_service.action_records**: Partition by action_date (monthly or quarterly) to improve query performance for date-range queries and facilitate data archiving.
2. **payment_service.payments**: Partition by payment_date (monthly) to optimize payment history queries and reporting.
3. **workflow_service.customer_agents**: Partition by start_date (quarterly) to efficiently manage historical assignment data.

### 3. Query Optimization for Access Patterns

#### Customer Management Access Pattern

```sql
-- Optimize for retrieving customer by ID
CREATE INDEX idx_customers_cif ON bank_sync_service.customers(cif);

-- Optimize for searching customers by name, national ID, or company registration
CREATE INDEX idx_customers_name ON bank_sync_service.customers(name);
CREATE INDEX idx_customers_national_id ON bank_sync_service.customers(national_id);
CREATE INDEX idx_customers_registration_number ON bank_sync_service.customers(registration_number);

-- Optimize for listing customers by segment or risk category
CREATE INDEX idx_customers_segment ON bank_sync_service.customers(segment);
```

#### Loan Management Access Pattern

```sql
-- Optimize for retrieving loan by ID or account number
CREATE INDEX idx_loans_account_number ON bank_sync_service.loans(account_number);

-- Optimize for listing loans by customer
CREATE INDEX idx_loans_cif ON bank_sync_service.loans(cif);

-- Optimize for listing loans by delinquency status
CREATE INDEX idx_loans_delinquency_status ON bank_sync_service.loans(delinquency_status);
CREATE INDEX idx_loans_dpd ON bank_sync_service.loans(dpd);
```

#### Collection Workflow Access Pattern

```sql
-- Optimize for assigning customers to agents
CREATE INDEX idx_customer_agents_is_current ON workflow_service.customer_agents(is_current);
CREATE INDEX idx_customer_agents_cif_is_current ON workflow_service.customer_agents(cif, is_current);

-- Optimize for recording collection actions and outcomes
CREATE INDEX idx_action_records_cif_action_date ON workflow_service.action_records(cif, action_date);
CREATE INDEX idx_action_records_loan_account_number_action_date ON workflow_service.action_records(loan_account_number, action_date);

-- Optimize for tracking customer-level collection status
CREATE INDEX idx_customer_cases_status_composite ON workflow_service.customer_cases(customer_status, processing_state_status, recovery_ability_status);
```

#### Payment Tracking Access Pattern

```sql
-- Optimize for viewing payment history by loan or customer
CREATE INDEX idx_payments_loan_account_number_payment_date ON payment_service.payments(loan_account_number, payment_date);
CREATE INDEX idx_payments_cif_payment_date ON payment_service.payments(cif, payment_date);
```

### 4. Data Volume and Growth Considerations

1. **Time-Series Data Management**:
   - Implement table partitioning for time-series data (payments, action_records)
   - Consider data archiving strategies for historical data older than a defined retention period

2. **Large Text Fields**:
   - Use TEXT data type for notes and descriptions
   - Consider compression for large text fields if supported by the database

3. **Historical Data**:
   - Implement SCD Type 2 for customer_agents to track historical assignments
   - Consider separate historical tables for high-volume entities if needed

### 5. Performance Optimization for Collection Workflows

1. **Materialized Views**:
   - Create materialized views for frequently accessed reports and dashboards
   - Example: Agent performance metrics, customer collection status summaries

2. **Denormalization**:
   - The customer_cases table is denormalized to store the current status of customers
   - This improves read performance for collection workflows at the cost of some write overhead

3. **Caching Strategy**:
   - Implement application-level caching for frequently accessed reference data
   - Cache customer and loan summary information for active collection cases

4. **Batch Processing**:
   - Design batch processes for data synchronization during off-peak hours
   - Implement incremental synchronization to minimize load

### 6. Database Maintenance Recommendations

1. **Statistics Updates**:
   - Regularly update database statistics to ensure optimal query execution plans
   - Schedule statistics updates after large data loads or synchronizations

2. **Index Maintenance**:
   - Regularly rebuild or reorganize indexes to prevent fragmentation
   - Monitor index usage and adjust indexing strategy as needed

3. **Vacuum/Cleanup**:
   - Schedule regular vacuum operations to reclaim space and update statistics
   - Implement auto-vacuum based on table update frequency

4. **Monitoring**:
   - Implement monitoring for slow queries
   - Set up alerts for database performance issues
   - Monitor disk space usage, especially for tables expected to grow rapidly

## Database Schema Diagram

```
bank_sync_service.customers 1 --- * bank_sync_service.phones
bank_sync_service.customers 1 --- * bank_sync_service.addresses
bank_sync_service.customers 1 --- * bank_sync_service.emails
bank_sync_service.customers 1 --- * bank_sync_service.loans
bank_sync_service.customers 1 --- * bank_sync_service.collaterals
bank_sync_service.customers 1 --- * bank_sync_service.reference_customers
bank_sync_service.customers 1 --- * workflow_service.customer_case_actions
bank_sync_service.customers 1 --- 1 workflow_service.customer_cases
bank_sync_service.customers * --- * workflow_service.agents (via workflow_service.customer_agents)

bank_sync_service.loans 1 --- * bank_sync_service.due_segmentations
bank_sync_service.loans 1 --- * workflow_service.action_records
bank_sync_service.loans 1 --- * payment_service.payments
bank_sync_service.loans * --- * bank_sync_service.collaterals (via bank_sync_service.loan_collaterals)

workflow_service.agents 1 --- * workflow_service.action_records
workflow_service.agents 1 --- * workflow_service.customer_case_actions
```

## Conclusion

This physical database schema design optimizes for the collection workflow requirements while maintaining data integrity and performance. The schema includes appropriate indexes, constraints, and optimization strategies to support the identified access patterns and expected data volumes.

Key features of this design include:
- Natural key approach for maintaining relationship integrity during synchronization
- Comprehensive indexing strategy for optimizing common queries
- SCD Type 2 implementation for tracking historical customer-agent assignments
- Denormalization where appropriate for performance optimization
- Partitioning recommendations for high-volume tables