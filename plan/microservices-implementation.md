# Microservices Implementation Plan

This document provides detailed technical specifications and implementation guidelines for each microservice in the Collection CRM system.

## 1. Bank Synchronization Microservice

### 1.1 Purpose and Responsibilities

The Bank Synchronization Microservice is responsible for:
- Importing data from external banking systems (T24, W4, LOS)
- Maintaining synchronized entities (Customer, Loan, Collateral, etc.)
- Providing read access to synchronized data
- Managing the integrity of relationships between synchronized entities

### 1.2 Technical Architecture

#### Core Components

1. **Synchronization Engine**
   - Handles ETL processes from external systems
   - Implements natural key-based synchronization
   - Manages incremental and full synchronization modes
   - Handles error recovery and logging

2. **Entity Repositories**
   - Implements repository pattern for each entity type
   - Provides CRUD operations with natural key support
   - Handles relationship management between entities
   - Implements data validation and transformation

3. **API Layer**
   - Exposes RESTful endpoints for data access
   - Implements filtering, sorting, and pagination
   - Provides search capabilities
   - Handles authentication and authorization

4. **Event Publishers**
   - Publishes events for entity changes
   - Implements event schema versioning
   - Handles event delivery guarantees
   - Provides event replay capabilities

#### Database Design

- Primary database: PostgreSQL
- Schema organization:
  - `sync_entities` schema for synchronized entities
  - `sync_metadata` schema for synchronization metadata
- Key tables:
  - `customer`, `phone`, `address`, `email`, `loan`, `collateral`, etc.
  - `sync_job`, `sync_event`, `sync_error`
- Indexing strategy:
  - Natural key indexes
  - Foreign key indexes
  - Full-text search indexes for searchable fields

#### Implementation Details

```typescript
// Synchronization Service Interface
interface SynchronizationService {
  // Synchronize all entities from a specific source
  syncAllEntities(source: SourceSystemType): Promise<SyncResult>;
  
  // Synchronize specific entity type
  syncEntityType<T extends SynchronizedEntity>(
    entityType: string, 
    source: SourceSystemType
  ): Promise<SyncResult>;
  
  // Get synchronization status
  getSyncStatus(): Promise<SyncStatus[]>;
  
  // Log synchronization event
  logSyncEvent(event: SyncEvent): Promise<void>;
}

// Entity Repository Interface
interface EntityRepository<T extends SynchronizedEntity> {
  // Find entity by natural key
  findByNaturalKey(naturalKey: string): Promise<T>;
  
  // Upsert entity by natural key
  upsertByNaturalKey(entity: T): Promise<T>;
  
  // Find entities by source system
  findBySourceSystem(source: SourceSystemType): Promise<T[]>;
  
  // Find stale records
  findStaleRecords(olderThan: Date): Promise<T[]>;
}

// Synchronization Flow
async function synchronizeEntities(source: SourceSystemType): Promise<SyncResult> {
  try {
    // 1. Connect to source system
    const connection = await connectToSource(source);
    
    // 2. Extract data by entity type
    const dataByEntity = await extractDataFromSource(connection);
    
    // 3. Process each entity type
    const results = [];
    for (const [entityType, data] of Object.entries(dataByEntity)) {
      // 4. Transform to internal model
      const transformedData = transformToInternalModel(entityType, data);
      
      // 5. Validate data
      const validatedData = validateData(transformedData);
      
      // 6. Upsert using natural keys
      const entityResult = await upsertEntities(entityType, validatedData);
      results.push(entityResult);
    }
    
    // 7. Verify referential integrity
    await verifyRelationships();
    
    // 8. Publish synchronization events
    await publishSyncEvents(source, results);
    
    return {
      success: true,
      entitiesProcessed: results.reduce((sum, r) => sum + r.processed, 0),
      entitiesCreated: results.reduce((sum, r) => sum + r.created, 0),
      entitiesUpdated: results.reduce((sum, r) => sum + r.updated, 0),
      entitiesDeleted: results.reduce((sum, r) => sum + r.deleted, 0),
      errors: results.reduce((sum, r) => sum + r.errors.length, 0)
    };
  } catch (error) {
    // Log error and return failure result
    await logSyncError(source, error);
    return {
      success: false,
      error: error.message,
      entitiesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      errors: 1
    };
  }
}
```

### 1.3 API Endpoints

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/api/sync/status` | GET | Get synchronization status | - | `SyncStatus[]` |
| `/api/sync/run` | POST | Trigger synchronization | `{ source: string, entityType?: string }` | `SyncResult` |
| `/api/customers/:cif` | GET | Get customer by CIF | - | `Customer` |
| `/api/customers/:cif/loans` | GET | Get customer loans | - | `Loan[]` |
| `/api/customers/:cif/collaterals` | GET | Get customer collaterals | - | `Collateral[]` |
| `/api/loans/:accountNumber` | GET | Get loan details | - | `Loan` |
| `/api/loans/delinquent` | GET | Get delinquent loans | `{ dpd?: number, status?: string }` | `Loan[]` |

### 1.4 Event Schema

```typescript
// Synchronization Event Schema
interface SyncEvent {
  id: string;
  type: 'ENTITY_UPDATED' | 'SYNC_COMPLETED' | 'SYNC_FAILED';
  entityType?: string;
  timestamp: Date;
  affectedRecords?: string[];  // Natural keys
  sourceSystem: SourceSystemType;
  details?: any;
}
```

### 1.5 Implementation Phases

1. **Phase 1: Core Framework**
   - Implement entity models
   - Create repository interfaces
   - Set up database schema
   - Implement basic synchronization service

2. **Phase 2: ETL Implementation**
   - Implement source system connectors
   - Create data transformation logic
   - Implement validation rules
   - Develop error handling

3. **Phase 3: API Development**
   - Implement REST endpoints
   - Create filtering and search
   - Add pagination
   - Implement security

4. **Phase 4: Event Integration**
   - Implement event publishers
   - Create event schemas
   - Add event handling logic
   - Test event flow

5. **Phase 5: Testing and Optimization**
   - Develop unit tests
   - Create integration tests
   - Optimize performance
   - Load test with production-like data

## 2. Payment Processing Microservice

### 2.1 Purpose and Responsibilities

The Payment Processing Microservice is responsible for:
- Processing real-time payment notifications
- Tracking payment history
- Reconciling payments with external systems
- Generating payment receipts and reports

### 2.2 Technical Architecture

#### Core Components

1. **Payment Processor**
   - Handles payment notifications
   - Validates payment data
   - Updates payment records
   - Publishes payment events

2. **Payment Repository**
   - Manages payment records
   - Provides query capabilities
   - Handles payment status updates
   - Maintains payment history

3. **Reconciliation Engine**
   - Compares payments across systems
   - Identifies discrepancies
   - Generates reconciliation reports
   - Resolves payment issues

4. **API Layer**
   - Exposes payment endpoints
   - Handles payment notifications
   - Provides payment history
   - Generates payment receipts

#### Database Design

- Primary database: PostgreSQL
- Schema organization:
  - `payments` schema for payment data
  - `reconciliation` schema for reconciliation data
- Key tables:
  - `payment`, `payment_allocation`, `payment_history`
  - `reconciliation_job`, `reconciliation_issue`
- Indexing strategy:
  - Payment reference indexes
  - Loan account indexes
  - Customer indexes
  - Date range indexes

#### Implementation Details

```typescript
// Payment Processing Service Interface
interface PaymentProcessingService {
  // Process payment notification
  processPayment(notification: PaymentNotification): Promise<Payment>;
  
  // Get payment by reference number
  getPayment(referenceNumber: string): Promise<Payment>;
  
  // Get payments for loan
  getLoanPayments(accountNumber: string): Promise<Payment[]>;
  
  // Get payments for customer
  getCustomerPayments(cif: string): Promise<Payment[]>;
  
  // Generate payment receipt
  generateReceipt(referenceNumber: string): Promise<PaymentReceipt>;
}

// Reconciliation Service Interface
interface ReconciliationService {
  // Reconcile payments for a date range
  reconcilePayments(startDate: Date, endDate: Date): Promise<ReconciliationReport>;
  
  // Get reconciliation issues
  getReconciliationIssues(): Promise<ReconciliationIssue[]>;
  
  // Resolve reconciliation issue
  resolveIssue(issueId: string, resolution: Resolution): Promise<void>;
}

// Payment Processing Flow
async function processPaymentNotification(notification: PaymentNotification): Promise<Payment> {
  try {
    // 1. Validate payment notification
    validateNotification(notification);
    
    // 2. Transform to internal payment model
    const payment = transformToPayment(notification);
    
    // 3. Validate business rules
    validatePaymentBusinessRules(payment);
    
    // 4. Store payment record
    const savedPayment = await upsertPayment(payment);
    
    // 5. Update related loan balances
    await updateLoanBalances(payment.loanAccountNumber, payment.amount);
    
    // 6. Publish payment event
    await publishPaymentEvent(savedPayment);
    
    // 7. Generate receipt if needed
    if (notification.requiresReceipt) {
      await generateAndSendReceipt(savedPayment);
    }
    
    return savedPayment;
  } catch (error) {
    // Log error and return failure result
    await logPaymentError(notification, error);
    throw error;
  }
}
```

### 2.3 API Endpoints

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/api/payments/loan/:accountNumber` | GET | Get payments for a loan | - | `Payment[]` |
| `/api/payments/customer/:cif` | GET | Get payments for a customer | - | `Payment[]` |
| `/api/payments` | POST | Record new payment | `Payment` | `Payment` |
| `/api/payments/:referenceNumber` | GET | Get payment details | - | `Payment` |
| `/api/payments/notification` | POST | Handle payment notification | `PaymentNotification` | `Payment` |
| `/api/payments/reconciliation` | POST | Trigger payment reconciliation | `{ startDate: Date, endDate: Date }` | `ReconciliationReport` |
| `/api/payments/receipt/:referenceNumber` | GET | Generate payment receipt | - | `PaymentReceipt` |

### 2.4 Event Schema

```typescript
// Payment Event Schema
interface PaymentEvent {
  id: string;
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'PAYMENT_REVERSED';
  paymentReferenceNumber: string;
  loanAccountNumber: string;
  cif: string;
  amount: number;
  timestamp: Date;
  status: string;
  details?: any;
}
```

### 2.5 Implementation Phases

1. **Phase 1: Core Framework**
   - Implement payment models
   - Create payment repository
   - Set up database schema
   - Implement basic payment service

2. **Phase 2: Payment Processing**
   - Implement notification handlers
   - Create validation logic
   - Implement payment storage
   - Develop error handling

3. **Phase 3: Reconciliation**
   - Implement reconciliation engine
   - Create discrepancy detection
   - Implement resolution workflows
   - Develop reporting

4. **Phase 4: API Development**
   - Implement REST endpoints
   - Create receipt generation
   - Add payment history
   - Implement security

5. **Phase 5: Event Integration**
   - Implement event publishers
   - Create event schemas
   - Add event handling logic
   - Test event flow

## 3. Collection Workflow Microservice

### 3.1 Purpose and Responsibilities

The Collection Workflow Microservice is responsible for:
- Managing collection agents and teams
- Tracking collection actions and outcomes
- Assigning customers to agents
- Managing customer cases and statuses
- Implementing collection strategies
- Generating performance reports

### 3.2 Technical Architecture

#### Core Components

1. **Agent Management**
   - Handles agent profiles
   - Manages team assignments
   - Tracks agent performance
   - Handles workload distribution

2. **Action Tracking**
   - Records collection actions
   - Tracks action outcomes
   - Manages action history
   - Provides action analytics

3. **Customer Assignment**
   - Implements assignment algorithms
   - Manages agent-customer relationships
   - Handles reassignments
   - Tracks assignment history

4. **Case Management**
   - Manages customer cases
   - Tracks case statuses
   - Implements case workflows
   - Provides case analytics

5. **Strategy Engine**
   - Implements collection strategies
   - Prioritizes collection activities
   - Generates task lists
   - Optimizes resource allocation

#### Database Design

- Primary database: PostgreSQL
- Schema organization:
  - `workflow` schema for workflow data
  - `agents` schema for agent data
  - `actions` schema for action data
- Key tables:
  - `agent`, `team`, `agent_performance`
  - `action_record`, `action_result`
  - `customer_agent`, `customer_case`, `customer_case_action`
- Indexing strategy:
  - Agent indexes
  - Customer indexes
  - Action type indexes
  - Date range indexes

#### Implementation Details

```typescript
// Agent Service Interface
interface AgentService {
  // Create or update agent
  saveAgent(agent: Agent): Promise<Agent>;
  
  // Get agent by ID
  getAgent(id: string): Promise<Agent>;
  
  // Get agent workload
  getAgentWorkload(agentId: string): Promise<WorkloadStats>;
  
  // Get agent performance
  getAgentPerformance(agentId: string, period: DateRange): Promise<PerformanceMetrics>;
}

// Action Service Interface
interface ActionService {
  // Record collection action
  recordAction(action: ActionRecord): Promise<ActionRecord>;
  
  // Get customer actions
  getCustomerActions(cif: string): Promise<ActionRecord[]>;
  
  // Get loan actions
  getLoanActions(accountNumber: string): Promise<ActionRecord[]>;
  
  // Get agent actions
  getAgentActions(agentId: string, period: DateRange): Promise<ActionRecord[]>;
}

// Assignment Service Interface
interface AssignmentService {
  // Assign customer to agent
  assignCustomer(assignment: CustomerAgent): Promise<CustomerAgent>;
  
  // Get agent assignments
  getAgentAssignments(agentId: string): Promise<CustomerAgent[]>;
  
  // Reassign customer
  reassignCustomer(cif: string, newAgentId: string): Promise<CustomerAgent>;
  
  // Get assignment history
  getAssignmentHistory(cif: string): Promise<CustomerAgent[]>;
}

// Case Service Interface
interface CaseService {
  // Record case action
  recordCaseAction(action: CustomerCaseAction): Promise<CustomerCaseAction>;
  
  // Get customer case history
  getCustomerCaseHistory(cif: string): Promise<CustomerCaseAction[]>;
  
  // Update customer status
  updateCustomerStatus(cif: string, statusUpdate: StatusUpdate): Promise<CustomerCase>;
}

// Action Recording Flow
async function recordActionFlow(action: ActionRecord): Promise<ActionRecord> {
  try {
    // 1. Validate action data
    validateActionData(action);
    
    // 2. Check authorization
    await checkUserAuthorization(action.createdBy, action.type);
    
    // 3. Store action record
    const savedAction = await saveActionRecord(action);
    
    // 4. Update statistics
    await updateAgentStats(action.createdBy);
    await updateCustomerStats(action.cif);
    
    // 5. Check for workflow triggers
    await checkWorkflowTriggers(action);
    
    // 6. Send notifications if needed
    await sendActionNotifications(action);
    
    // 7. Publish action event
    await publishActionEvent(savedAction);
    
    return savedAction;
  } catch (error) {
    // Log error and return failure result
    await logActionError(action, error);
    throw error;
  }
}
```

### 3.3 API Endpoints

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/api/agents` | GET | List agents | `{ team?: string, status?: string }` | `Agent[]` |
| `/api/agents` | POST | Create agent | `Agent` | `Agent` |
| `/api/agents/:id` | PUT | Update agent | `Agent` | `Agent` |
| `/api/agents/:id/performance` | GET | Get agent performance | `{ period: DateRange }` | `PerformanceMetrics` |
| `/api/actions/customer/:cif` | GET | Get customer actions | - | `ActionRecord[]` |
| `/api/actions/loan/:accountNumber` | GET | Get loan actions | - | `ActionRecord[]` |
| `/api/actions` | POST | Record new action | `ActionRecord` | `ActionRecord` |
| `/api/actions/:id/result` | PUT | Update action result | `{ result: ActionResultType }` | `ActionRecord` |
| `/api/assignments/agent/:agentId` | GET | Get agent assignments | - | `CustomerAgent[]` |
| `/api/assignments` | POST | Create assignment | `CustomerAgent` | `CustomerAgent` |
| `/api/assignments/:id` | PUT | Update assignment | `CustomerAgent` | `CustomerAgent` |
| `/api/cases/customer/:cif` | GET | Get customer case history | - | `CustomerCaseAction[]` |
| `/api/cases` | POST | Record case action | `CustomerCaseAction` | `CustomerCaseAction` |

### 3.4 Event Schema

```typescript
// Workflow Event Schema
interface WorkflowEvent {
  id: string;
  type: 'ACTION_RECORDED' | 'CUSTOMER_ASSIGNED' | 'STATUS_CHANGED';
  entityId: string;
  timestamp: Date;
  agentId?: string;
  details: any;
}
```

### 3.5 Implementation Phases

1. **Phase 1: Core Framework**
   - Implement agent models
   - Create action models
   - Set up database schema
   - Implement basic services

2. **Phase 2: Agent Management**
   - Implement agent profiles
   - Create team management
   - Implement performance tracking
   - Develop workload management

3. **Phase 3: Action Tracking**
   - Implement action recording
   - Create result tracking
   - Implement action history
   - Develop analytics

4. **Phase 4: Customer Assignment**
   - Implement assignment algorithms
   - Create assignment history
   - Implement reassignment logic
   - Develop optimization

5. **Phase 5: Case Management**
   - Implement case workflows
   - Create status tracking
   - Implement case history
   - Develop reporting

## 4. Authentication Microservice

### 4.1 Purpose and Responsibilities

The Authentication Microservice is responsible for:
- Managing user authentication and authorization
- Integrating with Active Directory
- Implementing role-based access control
- Managing user sessions
- Auditing security events
- Providing token validation services

### 4.2 Technical Architecture

#### Core Components

1. **Authentication Service**
   - Handles user login
   - Validates credentials
   - Issues JWT tokens
   - Manages token lifecycle

2. **AD Integration**
   - Connects to Active Directory
   - Synchronizes user information
   - Maps AD groups to roles
   - Handles AD authentication

3. **Authorization Service**
   - Manages roles and permissions
   - Implements access control
   - Validates user permissions
   - Handles role assignments

4. **Session Management**
   - Creates and tracks sessions
   - Handles session expiration
   - Manages concurrent sessions
   - Provides session validation

5. **Audit Service**
   - Logs security events
   - Tracks authentication attempts
   - Records access events
   - Generates audit reports

#### Database Design

- Primary database: PostgreSQL
- Schema organization:
  - `auth` schema for authentication data
  - `audit` schema for audit data
- Key tables:
  - `user`, `role`, `permission`, `user_role`
  - `session`, `token_blacklist`
  - `audit_log`, `auth_event`
- Indexing strategy:
  - User indexes
  - Role indexes
  - Session indexes
  - Timestamp indexes for audit logs

#### Implementation Details

```typescript
// Authentication Service Interface
interface AuthenticationService {
  // Authenticate user
  authenticateUser(username: string, password: string): Promise<AuthResult>;
  
  // Validate token
  validateToken(token: string): Promise<TokenValidationResult>;
  
  // Refresh token
  refreshToken(refreshToken: string): Promise<TokenRefreshResult>;
  
  // Revoke token
  revokeToken(token: string): Promise<void>;
  
  // Logout user
  logoutUser(userId: string): Promise<void>;
}

// Authorization Service Interface
interface AuthorizationService {
  // Get user roles
  getUserRoles(userId: string): Promise<Role[]>;
  
  // Get user permissions
  getUserPermissions(userId: string): Promise<Permission[]>;
  
  // Check permission
  checkPermission(userId: string, permission: string): Promise<boolean>;
  
  // Assign role to user
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
}

// Authentication Flow
async function authenticateUserFlow(username: string, password: string): Promise<AuthResult> {
  try {
    // 1. Validate input
    validateAuthenticationInput(username, password);
    
    // 2. Check if user exists
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }
    
    // 3. Authenticate against Active Directory
    const adAuthResult = await authenticateAgainstAD(username, password);
    if (!adAuthResult.success) {
      // Log failed login attempt
      await logAuthEvent({
        eventType: 'LOGIN_FAILED',
        userId: user.id,
        username: user.username,
        status: 'FAILED',
        reason: adAuthResult.reason,
        timestamp: new Date()
      });
      
      throw new Error('Authentication failed');
    }
    
    // 4. Create user session
    const session = await createSession(user.id);
    
    // 5. Generate JWT token
    const token = generateJWT(user, session);
    
    // 6. Log successful authentication
    await logAuthEvent({
      eventType: 'LOGIN_SUCCESS',
      userId: user.id,
      username: user.username,
      status: 'SUCCESS',
      timestamp: new Date()
    });
    
    // 7. Return authentication result
    return {
      success: true,
      user: sanitizeUser(user),
      token: token,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt
    };
  } catch (error) {
    // Log error
    await logAuthError(username, error);
    
    // Return failure result
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 4.3 API Endpoints

| Endpoint | Method | Description | Request | Response |
|----------|--------|-------------|---------|----------|
| `/api/auth/login` | POST | Authenticate user | `{ username: string, password: string }` | `AuthResult` |
| `/api/auth/logout` | POST | Logout user | `{ token: string }` | `{ success: boolean }` |
| `/api/auth/token/refresh` | POST | Refresh token | `{ refreshToken: string }` | `TokenRefreshResult` |
| `/api/auth/token/validate` | POST | Validate token | `{ token: string }` | `TokenValidationResult` |
| `/api/users` | GET | List users | `{ role?: string, status?: string }` | `User[]` |
| `/api/users/:id` | GET | Get user by ID | - | `User` |
| `/api/users/:id/roles` | GET | Get user roles | - | `Role[]` |
| `/api/roles` | GET | List roles | - | `Role[]` |
| `/api/roles/:id/permissions` | GET | Get role permissions | - | `Permission[]` |

### 4.4 Event Schema

```typescript
// Auth Event Schema
interface AuthEvent {
  id: string;
  type: 'USER_CREATED' | 'USER_UPDATED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT';
  userId?: string;
  username?: string;
  timestamp: Date;
  status: string;
  reason?: string;
  details?: any;
}
```

### 4.5 Implementation Phases

1. **Phase 1: Core Framework**
   - Implement user models
   - Create role and permission models
   - Set up database schema
   - Implement basic authentication service

2. **Phase 2: AD Integration**
   - Implement AD connector
   - Create user synchronization
   - Implement group mapping
   - Develop authentication flow

3. **Phase 3: Authorization**
   - Implement role management
   - Create permission system
   - Implement access control
   - Develop role assignment

4. **Phase 4: Session Management**
   - Implement session creation
   - Create token management
   - Implement session validation
   - Develop session expiration

5. **Phase 5: Audit and Security**
   - Implement audit logging
   - Create security event tracking
   - Implement reporting
   - Develop security monitoring