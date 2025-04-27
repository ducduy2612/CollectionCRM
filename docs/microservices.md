# Microservices Architecture Specification for Collection CRM System

Based on the data model, I've broken down the Collection CRM system into three distinct microservices as requested.

## 1. Bank Synchronization Microservice

### Purpose
Manages most data synchronized from the bank's core systems, responsible for importing, storing, and maintaining the integrity of financial data that originates outside the CRM (except payments, which are handled separately).

### Core Entities
All entities extending `SynchronizedEntity` (except Payment):
- Customer
- Phone
- Address
- Email
- Loan
- Collateral
- DueSegmentation
- ReferenceCustomer
- LoanCollateral (many-to-many relationship)

### Key Interfaces and Modules

```typescript
// Synchronization Service
interface BankSyncService {
  syncAllEntities(sourceSystem: SourceSystemType): SyncResult;
  syncEntityType<T extends SynchronizedEntity>(entityType: string, sourceSystem: SourceSystemType): SyncResult;
  getSyncStatus(): SyncStatus[];
  logSyncEvent(event: SyncEvent): void;
}

// Generic Repository for Synchronized Entities
interface SyncEntityRepository<T extends SynchronizedEntity> {
  findByNaturalKey(naturalKey: string): Promise<T>;
  upsertByNaturalKey(entity: T): Promise<T>;
  findBySourceSystem(source: SourceSystemType): Promise<T[]>;
  findStaleRecords(olderThan: Date): Promise<T[]>;
}

// Domain-Specific Services
interface CustomerService {
  getCustomerWithRelations(cif: string): Promise<CustomerFullView>;
  getCustomerLoans(cif: string): Promise<Loan[]>;
  getCustomerCollaterals(cif: string): Promise<Collateral[]>;
  searchCustomers(criteria: CustomerSearchCriteria): Promise<Customer[]>;
}

interface LoanService {
  getLoanWithCollaterals(accountNumber: string): Promise<LoanFullView>;
  searchDelinquentLoans(criteria: DelinquencySearchCriteria): Promise<Loan[]>;
}
```

### Synchronization Data Flow

```typescript
function syncDataFlow() {
  // 1. Connect to external sources (T24, W4, OTHER)
  const sourceConnections = connectToSources();
  
  // 2. Extract and process data by entity type
  for (const source of sourceConnections) {
    const dataByEntity = extractDataFromSource(source);
    
    // 3. Transform to internal model
    for (const [entityType, data] of Object.entries(dataByEntity)) {
      const transformedData = transformToInternalModel(entityType, data);
      
      // 4. Validate data
      const validatedData = validateData(transformedData);
      
      // 5. Upsert using natural keys
      for (const record of validatedData) {
        upsertByNaturalKey(entityType, record);
      }
    }
    
    // 6. Verify referential integrity
    verifyRelationships();
    
    // 7. Publish synchronization events
    publishSyncEvents(source);
  }
}
```

### API Endpoints

```
GET  /api/sync/status                    // Get sync status
POST /api/sync/run                       // Trigger synchronization
GET  /api/customers/:cif                 // Get customer by CIF
GET  /api/customers/:cif/loans           // Get customer loans
GET  /api/customers/:cif/collaterals     // Get customer collaterals
GET  /api/loans/:accountNumber           // Get loan details
GET  /api/loans/delinquent               // Get delinquent loans
```

## 2. Payment Processing Microservice

### Purpose
Handles real-time payment processing and synchronization with external payment systems. This microservice is separated to support the real-time nature of payment data, which requires different scaling and reliability characteristics than other synchronized data.

### Core Entities
- Payment

### Key Interfaces and Modules

```typescript
// Payment Synchronization Service
interface PaymentSyncService {
  syncRecentPayments(): Promise<SyncResult>;
  processPaymentNotification(notification: PaymentNotification): Promise<Payment>;
  reconcilePayments(date: Date): Promise<ReconciliationReport>;
}

// Payment Repository
interface PaymentRepository {
  findByReferenceNumber(referenceNumber: string): Promise<Payment>;
  findByLoanAccountNumber(accountNumber: string): Promise<Payment[]>;
  findByCustomer(cif: string): Promise<Payment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]>;
  upsertPayment(payment: Payment): Promise<Payment>;
}

// Payment Service
interface PaymentService {
  recordPayment(payment: Payment): Promise<Payment>;
  getLoanPayments(accountNumber: string): Promise<Payment[]>;
  getCustomerPayments(cif: string): Promise<Payment[]>;
  validatePayment(payment: Payment): Promise<ValidationResult>;
  generatePaymentReceipt(referenceNumber: string): Promise<PaymentReceipt>;
}
```

### Payment Processing Data Flow

```typescript
// Real-time payment notification handling
function handlePaymentNotification(notification: PaymentNotification) {
  // 1. Validate payment notification
  validateNotification(notification);
  
  // 2. Transform to internal payment model
  const payment = transformToPayment(notification);
  
  // 3. Validate business rules
  validatePaymentBusinessRules(payment);
  
  // 4. Store payment record
  const savedPayment = upsertPayment(payment);
  
  // 5. Update related loan balances
  updateLoanBalances(payment.loanAccountNumber, payment.amount);
  
  // 6. Publish payment event to other services
  publishPaymentEvent(savedPayment);
  
  // 7. Generate receipt if needed
  if (notification.requiresReceipt) {
    generateAndSendReceipt(savedPayment);
  }
  
  return savedPayment;
}

// Daily payment reconciliation
function reconcilePayments(date: Date) {
  // 1. Fetch payments from core banking system
  const corePayments = fetchCorePayments(date);
  
  // 2. Fetch payments from CRM database
  const crmPayments = fetchCrmPayments(date);
  
  // 3. Identify discrepancies
  const discrepancies = findDiscrepancies(corePayments, crmPayments);
  
  // 4. Resolve discrepancies
  const resolvedDiscrepancies = resolveDiscrepancies(discrepancies);
  
  // 5. Generate reconciliation report
  const report = generateReconciliationReport(resolvedDiscrepancies);
  
  return report;
}
```

### API Endpoints

```
GET  /api/payments/loan/:accountNumber   // Get payments for a loan
GET  /api/payments/customer/:cif         // Get payments for a customer
POST /api/payments                       // Record new payment
GET  /api/payments/:referenceNumber      // Get payment details
POST /api/payments/notification          // Handle payment notification
POST /api/payments/reconciliation        // Trigger payment reconciliation
GET  /api/payments/receipt/:referenceNumber // Generate payment receipt
```

## 3. Collection Workflow Microservice

### Purpose
Manages the collection process workflow, including agent management, action tracking, customer assignments, and case management.

### Core Entities
Entities managed within the CRM:
- Agent
- ActionRecord
- CustomerAgent
- CustomerCaseAction

### Key Interfaces and Modules

```typescript
// Agent Management
interface AgentService {
  createAgent(agent: Agent): Promise<Agent>;
  updateAgent(id: string, agentData: Partial<Agent>): Promise<Agent>;
  getAgentWorkload(agentId: string): Promise<WorkloadStats>;
  getAgentPerformance(agentId: string, period: DateRange): Promise<PerformanceMetrics>;
}

// Collection Action Management
interface ActionService {
  recordAction(action: ActionRecord): Promise<ActionRecord>;
  getCustomerActions(cif: string): Promise<ActionRecord[]>;
  getLoanActions(accountNumber: string): Promise<ActionRecord[]>;
  updateActionResult(actionId: string, result: ActionResultType, notes: string): Promise<ActionRecord>;
}

// Customer Assignment Management
interface AssignmentService {
  assignCustomerToAgent(assignment: CustomerAgent): Promise<CustomerAgent>;
  getAgentAssignments(agentId: string): Promise<CustomerAgent[]>;
  reassignCustomer(cif: string, newAgentId: string): Promise<CustomerAgent>;
  getAssignmentHistory(cif: string): Promise<CustomerAgent[]>;
}

// Case Management
interface CaseService {
  recordCaseAction(action: CustomerCaseAction): Promise<CustomerCaseAction>;
  getCustomerCaseHistory(cif: string): Promise<CustomerCaseAction[]>;
  updateCustomerStatus(cif: string, statusUpdate: StatusUpdate): Promise<CustomerCaseAction>;
}
```

### Collection Workflow Data Flow

```typescript
// Action recording flow
function recordActionFlow(action: ActionRecord) {
  // 1. Validate action data
  validateActionData(action);
  
  // 2. Check authorization
  checkUserAuthorization(action.createdBy, action.type);
  
  // 3. Store action record
  const savedAction = saveActionRecord(action);
  
  // 4. Update statistics
  updateAgentStats(action.createdBy);
  updateCustomerStats(action.cif);
  
  // 5. Check for workflow triggers
  checkWorkflowTriggers(action);
  
  // 6. Send notifications if needed
  sendActionNotifications(action);
  
  return savedAction;
}

// Customer assignment flow
function assignCustomerFlow(assignment: CustomerAgent) {
  // 1. End current assignments (SCD Type 2)
  const currentAssignments = findCurrentAssignments(assignment.cif);
  endCurrentAssignments(currentAssignments);
  
  // 2. Create new assignment
  assignment.startDate = new Date();
  assignment.isCurrent = true;
  
  // 3. Check agent capacity
  checkAgentWorkload(assignment.assignedAgentId);
  
  // 4. Save new assignment
  const savedAssignment = saveAssignment(assignment);
  
  // 5. Notify relevant parties
  notifyAssignmentChange(assignment);
  
  return savedAssignment;
}
```

### API Endpoints

```
GET  /api/agents                       // List agents
POST /api/agents                       // Create agent
PUT  /api/agents/:id                   // Update agent
GET  /api/agents/:id/performance       // Get agent performance

GET  /api/actions/customer/:cif        // Get customer actions
GET  /api/actions/loan/:accountNumber  // Get loan actions
POST /api/actions                      // Record new action
PUT  /api/actions/:id/result           // Update action result

GET  /api/assignments/agent/:agentId   // Get agent assignments
POST /api/assignments                  // Create assignment
PUT  /api/assignments/:id              // Update assignment

GET  /api/cases/customer/:cif          // Get customer case history
POST /api/cases                        // Record case action
```

## Inter-Service Communication

### Synchronization and Data Access

```typescript
// Data Query Services (exposing data between microservices)
interface BankDataQueryService {
  getCustomerInfo(cif: string): Promise<CustomerInfo>;
  getLoanInfo(accountNumber: string): Promise<LoanInfo>;
  searchCustomers(criteria: CustomerSearchCriteria): Promise<CustomerInfo[]>;
  searchLoans(criteria: LoanSearchCriteria): Promise<LoanInfo[]>;
}

interface PaymentDataQueryService {
  getLoanPayments(accountNumber: string): Promise<PaymentInfo[]>;
  getCustomerPayments(cif: string): Promise<PaymentInfo[]>;
  getPaymentDetails(referenceNumber: string): Promise<PaymentInfo>;
}

// Event-Based Integration
type SyncEvent = {
  type: 'ENTITY_UPDATED' | 'SYNC_COMPLETED' | 'SYNC_FAILED';
  entityType: string;
  timestamp: Date;
  affectedRecords?: string[];  // Natural keys
  sourceSystem: SourceSystemType;
}

type PaymentEvent = {
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'PAYMENT_REVERSED';
  paymentReferenceNumber: string;
  loanAccountNumber: string;
  cif: string;
  amount: number;
  timestamp: Date;
  status: string;
}

type WorkflowEvent = {
  type: 'ACTION_RECORDED' | 'CUSTOMER_ASSIGNED' | 'STATUS_CHANGED';
  entityId: string;
  timestamp: Date;
  agentId?: string;
  details: any;
}

// Event Handlers
function handlePaymentEvents(event: PaymentEvent) {
  if (event.type === 'PAYMENT_RECEIVED') {
    // Notify workflow service about payment
    notifyWorkflowService('PAYMENT_RECEIVED', {
      loanAccountNumber: event.loanAccountNumber,
      amount: event.amount,
      referenceNumber: event.paymentReferenceNumber
    });
    
    // Update loan balances in Bank Sync service
    updateLoanBalance(event.loanAccountNumber, event.amount);
  }
}

function handleSyncEvents(event: SyncEvent) {
  if (event.type === 'ENTITY_UPDATED') {
    if (event.entityType === 'Customer') {
      notifyWorkflowService('CUSTOMER_UPDATED', event.affectedRecords);
    } else if (event.entityType === 'Loan') {
      // If loan status changed, may need to update workflow
      notifyWorkflowService('LOAN_UPDATED', event.affectedRecords);
    }
  }
}
```

## Data Security and Access Control

```typescript
// Access Control Matrix
const accessControlMatrix = {
  bankSyncService: {
    read: ["AGENT", "SUPERVISOR", "ADMIN"],
    write: ["ADMIN", "SYSTEM"]
  },
  paymentService: {
    read: ["AGENT", "SUPERVISOR", "ADMIN"],
    write: ["SYSTEM", "ADMIN", "PAYMENT_PROCESSOR"]
  },
  workflowService: {
    read: ["AGENT", "SUPERVISOR", "ADMIN"],
    write: ["AGENT", "SUPERVISOR", "ADMIN"]
  }
};

// Data-Level Security
function enforceDataSecurity() {
  // Bank sync microservice: Read-only for most users
  const syncEntityRules = [
    { entity: "Customer", readRoles: ["AGENT", "SUPERVISOR", "ADMIN"], writeRoles: ["ADMIN", "SYSTEM"] },
    { entity: "Loan", readRoles: ["AGENT", "SUPERVISOR", "ADMIN"], writeRoles: ["ADMIN", "SYSTEM"] }
  ];
  
  // Payment microservice: Controlled write access
  const paymentEntityRules = [
    { entity: "Payment", readRoles: ["AGENT", "SUPERVISOR", "ADMIN"], 
      writeRoles: ["ADMIN", "SYSTEM", "PAYMENT_PROCESSOR"] }
  ];
  
  // Workflow microservice: Write access for authorized roles
  const workflowEntityRules = [
    { entity: "ActionRecord", readRoles: ["AGENT", "SUPERVISOR", "ADMIN"], 
      writeRoles: ["AGENT", "SUPERVISOR", "ADMIN"] },
    { entity: "CustomerAgent", readRoles: ["AGENT", "SUPERVISOR", "ADMIN"], 
      writeRoles: ["SUPERVISOR", "ADMIN"] }
  ];
}
```

## Deployment Considerations

```typescript
// Microservice Scaling Patterns
const scalingPatterns = {
  bankSyncService: {
    pattern: "scheduled-scaling",
    description: "Scale up during scheduled synchronization windows (typically overnight)",
    minInstances: 2,
    maxInstances: 10
  },
  
  paymentService: {
    pattern: "high-availability",
    description: "Maintain high availability with auto-scaling based on queue depth",
    minInstances: 5,
    maxInstances: 20,
    scalingMetric: "payment-queue-depth"
  },
  
  workflowService: {
    pattern: "time-of-day",
    description: "Scale based on business hours when agents are active",
    minInstances: 3,
    maxInstances: 15,
    businessHoursScaling: {
      start: "08:00",
      end: "18:00",
      timeZone: "UTC+7",
      minInstances: 10
    }
  }
};
```

This architecture separates the system into three distinct microservices with clear boundaries of responsibility:

1. **Bank Synchronization Microservice**: Handles batch synchronization of core banking data
2. **Payment Processing Microservice**: Manages real-time payment processing and synchronization
3. **Collection Workflow Microservice**: Manages the collection process and agent activities

This separation improves maintainability, allows for independent scaling based on different usage patterns, and provides better resilience by isolating the real-time payment processing from batch synchronization processes.