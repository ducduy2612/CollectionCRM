# Data Model

This document outlines the data model for the Collection CRM system based on the actual PostgreSQL database schema.

## Overview

CollectionCRM uses a PostgreSQL database with separate schemas for each service:

- **auth_service**: User authentication and authorization
- **bank_sync_service**: Customer, loan, and collateral data synchronized from external systems
- **payment_service**: Payment tracking and processing (partitioned by date)
- **workflow_service**: Collection workflow, actions, agents, and status tracking

## Key Features

- **Partitioned Tables**: Large tables like `action_records`, `payments`, and `customer_agents` are partitioned by date for performance
- **Materialized Views**: Pre-computed views for reporting and analytics
- **Customizable Dictionaries**: Action types, status values, and processing states are configurable through admin interfaces
- **SCD Type 2**: Customer-agent assignments track historical changes
- **Source System Tracking**: Data includes source system metadata for audit and edit permission control

## Core Types

### Source System Types
```sql
CREATE TYPE source_system_type AS ENUM ('T24', 'W4', 'OTHER', 'CRM');
```

### Customer Types
```sql
CREATE TYPE customer_type AS ENUM ('INDIVIDUAL', 'ORGANIZATION');
```

### Loan Status
```sql
CREATE TYPE loan_status AS ENUM ('OPEN', 'CLOSED');
```

### Payment Status
```sql
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');
```

## Entity Definitions

### 1. SynchronizedEntity

Base interface for all entities that are synchronized from external systems:

```typescript
interface SynchronizedEntity {
  sourceSystem: SourceSystemType; // Origin system (T24, W4, OTHER, CRM)
  createdBy: string;              // User/system that created
  updatedBy: string;              // User/system that last updated
  createdAt: Date;                // Creation timestamp
  updatedAt: Date;                // Last update timestamp
  isEditable: boolean;            // Whether record can be modified
  lastSyncedAt?: Date;            // Last synchronization timestamp
}
```

## Auth Service Schema

### Users
```typescript
interface User {
  id: string;                     // UUID primary key
  username: string;               // Unique username
  email: string;                  // Unique email
  passwordHash: string;           // Hashed password
  firstName?: string;             // First name
  lastName?: string;              // Last name
  role: string;                   // User role
  isActive: boolean;              // Whether user is active
  createdAt: Date;
  updatedAt: Date;
}
```

### Roles
```typescript
interface Role {
  id: string;                     // UUID primary key
  name: string;                   // Unique role name
  description?: string;           // Role description
  createdAt: Date;
  updatedAt: Date;
}
```

### Permissions
```typescript
interface Permission {
  id: string;                     // UUID primary key
  roleId: string;                 // Reference to role
  resource: string;               // Resource name
  action: string;                 // Action allowed
  createdAt: Date;
  updatedAt: Date;
}
```

### User Sessions
```typescript
interface UserSession {
  id: string;                     // UUID primary key
  userId: string;                 // Reference to user
  token: string;                  // Session token
  expiresAt: Date;                // Expiration timestamp
  createdAt: Date;
  ipAddress?: string;             // Client IP address
  userAgent?: string;             // Client user agent
}
```

## Bank Sync Service Schema

### Customer
```typescript
interface Customer extends SynchronizedEntity {
  id: string;                     // UUID primary key
  cif: string;                    // VPBANK CIF (unique, natural key)
  type: 'INDIVIDUAL' | 'ORGANIZATION'; // Customer type
  
  // For individuals
  name?: string;                  // Name
  dateOfBirth?: Date;             // Date of birth
  nationalId?: string;            // National ID number
  gender?: string;                // Gender
  
  // For organizations
  companyName?: string;           // Company name
  registrationNumber?: string;    // Registration number
  taxId?: string;                 // Tax ID
  
  segment: string;                // Customer segment
  status: string;                 // Customer status
}
```

### Phone
```typescript
interface Phone extends SynchronizedEntity {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  type: string;                   // Phone type (MOBILE, HOME, WORK, etc.)
  number: string;                 // Phone number
  isPrimary: boolean;             // Whether this is primary phone
  isVerified: boolean;            // Whether phone is verified
  verificationDate?: Date;        // When phone was verified
}
```

### Address
```typescript
interface Address extends SynchronizedEntity {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  type: string;                   // Address type (HOME, WORK, BILLING, etc.)
  addressLine1: string;           // Address line 1
  addressLine2?: string;          // Address line 2
  city: string;                   // City
  state: string;                  // State/Province
  district: string;               // District
  country: string;                // Country
  isPrimary: boolean;             // Whether this is primary address
  isVerified: boolean;            // Whether address is verified
  verificationDate?: Date;        // When address was verified
}
```

### Email
```typescript
interface Email extends SynchronizedEntity {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  address: string;                // Email address
  isPrimary: boolean;             // Whether this is primary email
  isVerified: boolean;            // Whether email is verified
  verificationDate?: Date;        // When email was verified
}
```

### Loan
```typescript
interface Loan extends SynchronizedEntity {
  id: string;                     // UUID primary key
  accountNumber: string;          // Loan account number (unique, natural key)
  cif: string;                    // Reference to customer CIF
  productType: string;            // Loan product type
  originalAmount: number;         // Original loan amount
  currency: string;               // Currency code
  disbursementDate: Date;         // Disbursement date
  maturityDate: Date;             // Maturity date
  interestRate: number;           // Interest rate
  term: number;                   // Loan term in months
  paymentFrequency: string;       // Payment frequency
  limitAmount?: number;           // Limit amount for OD & Cards
  
  outstanding: number;            // Current outstanding balance
  remainingAmount: number;        // Remaining amount
  dueAmount: number;              // Current due amount
  minPay?: number;                // For cards product
  nextPaymentDate: Date;          // Next payment date
  dpd: number;                    // Days past due
  delinquencyStatus: string;      // Delinquency status
  
  status: 'OPEN' | 'CLOSED';      // Loan status
  closeDate?: Date;               // Loan close date
  resolutionCode?: string;        // Resolution code
  resolutionNotes?: string;       // Resolution notes
}
```

### Collateral
```typescript
interface Collateral extends SynchronizedEntity {
  id: string;                     // UUID primary key
  collateralNumber: string;       // Collateral number (unique, natural key)
  cif: string;                    // Reference to customer CIF
  type: string;                   // Collateral type
  description: string;            // Description
  value: number;                  // Assessed value
  valuationDate: Date;            // Valuation date
  
  // For vehicles
  make?: string;                  // Vehicle make
  model?: string;                 // Vehicle model
  year?: number;                  // Vehicle year
  vin?: string;                   // Vehicle identification number
  licensePlate?: string;          // License plate
  
  // For real estate
  propertyType?: string;          // Property type
  address?: string;               // Property address
  size?: number;                  // Property size
  titleNumber?: string;           // Title number
}
```

### DueSegmentation
```typescript
interface DueSegmentation extends SynchronizedEntity {
  id: string;                     // UUID primary key
  loanAccountNumber: string;      // Reference to loan account number
  dueDate: Date;                  // Due date
  principalAmount: number;        // Principal amount
  interestAmount: number;         // Interest amount
  feesAmount: number;             // Fees amount
  penaltyAmount: number;          // Penalty amount
}
```

### ReferenceCustomer
```typescript
interface ReferenceCustomer extends SynchronizedEntity {
  id: string;                     // UUID primary key
  refCif: string;                 // Reference customer CIF (unique, natural key)
  primaryCif: string;             // Reference to primary customer CIF
  relationshipType: string;       // Relationship type
  type: 'INDIVIDUAL' | 'ORGANIZATION'; // Customer type
  
  // For individuals
  name?: string;                  // Name
  dateOfBirth?: Date;             // Date of birth
  nationalId?: string;            // National ID
  gender?: string;                // Gender
  
  // For organizations
  companyName?: string;           // Company name
  registrationNumber?: string;    // Registration number
  taxId?: string;                 // Tax ID
}
```

### LoanCollateral
```typescript
interface LoanCollateral {
  id: string;                     // UUID primary key
  loanAccountNumber: string;      // Reference to loan account number
  collateralNumber: string;       // Reference to collateral number
  sourceSystem: SourceSystemType; // Source system
  createdAt: Date;
  updatedAt: Date;
}
```

## Payment Service Schema

### Payment (Partitioned)
```typescript
interface Payment extends SynchronizedEntity {
  id: string;                     // UUID primary key
  referenceNumber: string;        // Reference number (natural key)
  loanAccountNumber: string;      // Reference to loan account number
  cif: string;                    // Reference to customer CIF
  amount: number;                 // Payment amount
  currency: string;               // Currency code
  paymentDate: Date;              // Payment date (partition key)
  paymentMethod: string;          // Payment method
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'; // Payment status
  statusReason?: string;          // Status reason
}
```

## Workflow Service Schema

### Agent
```typescript
interface Agent {
  id: string;                     // UUID primary key
  employeeId: string;             // Employee ID (unique)
  name: string;                   // Agent name
  email: string;                  // Work email (unique)
  phone?: string;                 // Work phone
  type: string;                   // Agent type (AGENT, SUPERVISOR, ADMIN)
  team: string;                   // Team assignment
  userId?: string;                // Reference to auth user
  isActive: boolean;              // Whether agent is active
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

### Action Configuration Tables

#### ActionTypes
```typescript
interface ActionTypes {
  id: string;                     // UUID primary key
  code: string;                   // Action type code (unique)
  name: string;                   // Display name
  description?: string;           // Description
  isActive: boolean;              // Whether type is active
  displayOrder: number;           // Display order
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### ActionSubtypes
```typescript
interface ActionSubtypes {
  id: string;                     // UUID primary key
  code: string;                   // Action subtype code (unique)
  name: string;                   // Display name
  description?: string;           // Description
  isActive: boolean;              // Whether subtype is active
  displayOrder: number;           // Display order
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### ActionResults
```typescript
interface ActionResults {
  id: string;                     // UUID primary key
  code: string;                   // Action result code (unique)
  name: string;                   // Display name
  description?: string;           // Description
  isActive: boolean;              // Whether result is active
  displayOrder: number;           // Display order
  isPromise: boolean;             // Whether this result indicates a promise to pay
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

### ActionRecord (Partitioned)
```typescript
interface ActionRecord {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  loanAccountNumber: string;      // Reference to loan account number
  agentId: string;                // Reference to agent
  actionTypeId: string;           // Reference to action type
  actionSubtypeId: string;        // Reference to action subtype
  actionResultId: string;         // Reference to action result
  actionDate: Date;               // When action occurred (partition key)
  
  // Promise tracking
  promiseDate?: Date;             // Date customer promised to pay
  promiseAmount?: number;         // Amount customer promised to pay
  dueAmount?: number;             // Due amount at time of action
  dpd?: number;                   // Days past due at time of action
  fUpdate?: Date;                 // Follow-up date
  
  notes?: string;                 // Action notes
  
  // For visits
  visitLatitude?: number;         // Visit location latitude
  visitLongitude?: number;        // Visit location longitude
  visitAddress?: string;          // Visit location address
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

### CustomerAgent (Partitioned, SCD Type 2)
```typescript
interface CustomerAgent {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  assignedCallAgentId?: string;   // Assigned call agent
  assignedFieldAgentId?: string;  // Assigned field agent
  startDate: Date;                // Assignment start date (partition key)
  endDate?: Date;                 // Assignment end date
  isCurrent: boolean;             // Whether this is current assignment
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

### CustomerCase
```typescript
interface CustomerCase {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF (unique)
  assignedCallAgentId?: string;   // Currently assigned call agent
  assignedFieldAgentId?: string;  // Currently assigned field agent
  fUpdate?: Date;                 // Follow-up date
  masterNotes?: string;           // Master notes for the case
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

### Status Dictionary Tables

All status dictionary tables follow this pattern:

```typescript
interface StatusDict {
  id: string;                     // UUID primary key
  code: string;                   // Status code (unique)
  name: string;                   // Display name
  description?: string;           // Description
  color?: string;                 // Hex color code for UI
  isActive: boolean;              // Whether status is active
  displayOrder: number;           // Display order
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

Dictionary tables include:
- **customer_status_dict**: Customer status values
- **collateral_status_dict**: Collateral status values
- **processing_state_dict**: Processing states
- **processing_substate_dict**: Processing substates
- **lending_violation_status_dict**: Lending violation statuses
- **recovery_ability_status_dict**: Recovery ability assessments

### Status Tracking Tables

All status tracking tables follow this pattern:

```typescript
interface StatusTracking {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  agentId: string;                // Agent who updated the status
  actionDate: Date;               // When status was updated
  statusId: string;               // Reference to status dictionary
  notes?: string;                 // Additional notes
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

Status tracking tables include:
- **customer_status**: Customer status updates
- **collateral_status**: Collateral status updates (with optional collateral_number)
- **processing_state_status**: Processing state updates (with state_id and optional substate_id)
- **lending_violation_status**: Lending violation status updates
- **recovery_ability_status**: Recovery ability status updates

### User-Input Contact Information

The workflow service includes tables for contact information that agents can add or modify:

#### Phones (User Input)
```typescript
interface Phones {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  type: string;                   // Phone type
  number: string;                 // Phone number
  isPrimary: boolean;             // Whether this is primary phone
  isVerified: boolean;            // Whether phone is verified
  verificationDate?: Date;        // When phone was verified
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### Addresses (User Input)
```typescript
interface Addresses {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  type: string;                   // Address type
  addressLine1: string;           // Address line 1
  addressLine2?: string;          // Address line 2
  city: string;                   // City
  state: string;                  // State/Province
  district: string;               // District
  country: string;                // Country
  isPrimary: boolean;             // Whether this is primary address
  isVerified: boolean;            // Whether address is verified
  verificationDate?: Date;        // When address was verified
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### Emails (User Input)
```typescript
interface Emails {
  id: string;                     // UUID primary key
  cif: string;                    // Reference to customer CIF
  address: string;                // Email address
  isPrimary: boolean;             // Whether this is primary email
  isVerified: boolean;            // Whether email is verified
  verificationDate?: Date;        // When email was verified
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

#### ReferenceCustomer (User Input)
```typescript
interface ReferenceCustomer {
  id: string;                     // UUID primary key
  refCif: string;                 // Reference customer CIF (unique)
  primaryCif: string;             // Reference to primary customer CIF
  relationshipType: string;       // Relationship type
  type: 'INDIVIDUAL' | 'ORGANIZATION'; // Customer type
  
  // For individuals
  name?: string;                  // Name
  dateOfBirth?: Date;             // Date of birth
  nationalId?: string;            // National ID
  gender?: string;                // Gender
  
  // For organizations
  companyName?: string;           // Company name
  registrationNumber?: string;    // Registration number
  taxId?: string;                 // Tax ID
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

## Table Partitioning

The following tables are partitioned by date for performance:

### action_records
- Partitioned by `action_date`
- Quarterly partitions (2025 Q1-Q4, 2026 Q1-Q4)
- Historical partition for data before 2025
- Future partition for data after 2026

### payments
- Partitioned by `payment_date`
- Quarterly partitions (2025 Q1-Q4, 2026 Q1-Q4)
- Historical partition for data before 2025
- Future partition for data after 2026

### customer_agents
- Partitioned by `start_date`
- Quarterly partitions (2025 Q1-Q4, 2026 Q1-Q4)
- Historical partition for data before 2025
- Future partition for data after 2026

## Materialized Views

### payment_summary
Provides payment summary metrics for reporting:
- Total paid amount by loan/customer/month/year
- Count of successful and failed payments
- Last payment date

### payment_method_analysis
Provides payment method analysis:
- Payment counts and amounts by method
- Success/failure rates by method
- Trends by month/year

### agent_performance
Provides agent performance metrics:
- Total actions per agent
- Total customers handled
- Payment promises obtained
- Performance by month/year

## Administrative Functions

The system provides comprehensive stored procedures for managing dictionary values and configurations:

### Action Configuration Management
```sql
-- Add new values
SELECT workflow_service.add_action_type('NEW_TYPE', 'New Type Name', 'Description');
SELECT workflow_service.add_action_subtype('NEW_SUBTYPE', 'New Subtype Name', 'Description');
SELECT workflow_service.add_action_result('NEW_RESULT', 'New Result Name', 'Description');

-- Create mappings
SELECT workflow_service.map_type_to_subtype('CALL', 'REMINDER_CALL');
SELECT workflow_service.map_subtype_to_result('REMINDER_CALL', 'PROMISE_TO_PAY');

-- Safely deactivate (prevents if used in existing records)
SELECT workflow_service.deactivate_action_type('OLD_TYPE');

-- Get usage statistics
SELECT * FROM workflow_service.get_configuration_usage_stats();
```

### Status Dictionary Management
```sql
-- Add new status values
SELECT workflow_service.add_customer_status('NEW_STATUS', 'New Status', 'Description', '#color');
SELECT workflow_service.add_processing_state('NEW_STATE', 'New State', 'Description', '#color');

-- Create state-substate mappings
SELECT workflow_service.map_state_to_substate('INVESTIGATION', 'INITIAL_REVIEW');

-- Get usage statistics
SELECT * FROM workflow_service.get_status_usage_stats();
```

### Data Synchronization Functions
```sql
-- Sync customer cases from bank sync service
SELECT workflow_service.sync_customer_cases();

-- Refresh materialized views
SELECT payment_service.refresh_payment_materialized_views();
SELECT workflow_service.refresh_workflow_materialized_views();
```

## Access Patterns

### Customer Management
- Retrieve customer by CIF
- Search customers by name, national ID, or company registration
- List customers by segment or status
- View customer's loans and collection history
- Manage customer contact information and references

### Loan Management
- Retrieve loan by account number
- List loans by customer CIF
- List loans by delinquency status or DPD
- View loan payment history and due segmentations
- View loan collateral associations

### Collection Workflow
- Assign customers to agents (with SCD Type 2 tracking)
- Record collection actions with customizable types/subtypes/results
- Track customer status across multiple dimensions
- Generate agent performance reports
- Track promises to pay and follow-up dates

### Payment Tracking
- Record and track payments (partitioned by date)
- View payment history by loan or customer
- Analyze payment methods and success rates
- Generate payment summary reports

### Reporting and Analytics
- Agent performance metrics by time period
- Payment analysis by method and outcome
- Customer status distribution and trends
- Collection effectiveness tracking

## Data Access Control

| Entity                    | Collection Agent | Team Lead | Administrator |
|---------------------------|------------------|-----------|---------------|
| Customer (bank_sync)      | Read             | Read      | Read          |
| Phone/Address/Email (bank_sync) | Read       | Read      | Read          |
| Phone/Address/Email (workflow) | Read/Write | Read/Write| Read/Write    |
| Loan                      | Read             | Read      | Read          |
| Collateral                | Read             | Read      | Read          |
| ActionRecord              | Read/Write       | Read/Write| Read/Write    |
| Agent                     | Read             | Read/Write| Read/Write    |
| Payment                   | Read             | Read      | Read          |
| Status Dictionaries       | Read             | Read      | Read/Write    |
| Action Configuration      | Read             | Read      | Read/Write    |
| CustomerAgent             | Read             | Read/Write| Read/Write    |
| Status Tracking           | Read/Write       | Read/Write| Read/Write    |
| ReferenceCustomer         | Read/Write       | Read/Write| Read/Write    |

## Data Source Integration

### External Systems
- **T24**: Core banking system (customers, loans, collaterals)
- **W4**: Workflow system (process data)
- **Payment Systems**: Real-time payment updates

### Internal Systems
- **CRM**: Internally created and managed data
- All user-input contact information and status updates
- Action records and agent assignments
- Reference customer relationships

### Data Validation
- Source system tracking prevents modification of external data
- Edit permissions based on `sourceSystem` and `isEditable` flags
- Historical data preservation for deactivated dictionary values
- Referential integrity through foreign key constraints

This data model supports a scalable, auditable collection management system with flexible configuration capabilities and comprehensive tracking of all collection activities.