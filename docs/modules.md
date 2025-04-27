# System Modules

This document outlines the modular breakdown of the Collection CRM system, detailing each module's responsibilities, interfaces, and interactions.

## Module Architecture Overview

The Collection CRM system is designed with a modular architecture to promote separation of concerns, maintainability, and scalability. The system is divided into the following high-level modules:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Collection CRM System                              │
│                                                                             │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────────────┐    │
│  │               │      │               │      │                       │    │
│  │  Presentation │◄────►│  Business     │◄────►│  Data                 │    │
│  │  Layer        │      │  Layer        │      │  Layer                │    │
│  │               │      │               │      │                       │    │
│  └───────────────┘      └───────┬───────┘      └───────────────────────┘    │
│                                 │                                            │
│                         ┌───────┴───────┐                                    │
│                         │               │                                    │
│                         │  Integration  │                                    │
│                         │  Layer        │                                    │
│                         │               │                                    │
│                         └───────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1. Presentation Layer

The Presentation Layer is responsible for the user interface and user experience of the Collection CRM system.

### 1.1 Web Portal Module

**Responsibilities:**
- Render user interface components
- Handle user interactions
- Implement responsive design
- Manage client-side state
- Communicate with backend APIs

**Components:**
- **Authentication Components**: Login, logout, integrate with the organization AD service
- **Dashboard Components**: Summary widgets, performance metrics
- **Customer Management Components**: Customer search, profile view, contact management
- **Loan Management Components**: Loan details, payment history
- **Case Management Components**: Case list, case details, action recording
- **Collection Strategy Components**: Strategy configuration, assignment
- **Reporting Components**: Report generation, visualization

**Interfaces:**
- Consumes REST APIs from the API Gateway
- Uses WebSockets for real-time updates

### 1.2 Notification Module

**Responsibilities:**
- Display system notifications to users
- Manage notification preferences
- Handle real-time alerts

**Components:**
- **Notification Center**: Central hub for all user notifications
- **Alert Manager**: Handles real-time alerts
- **Preference Manager**: Manages user notification preferences

**Interfaces:**
- Consumes notification events from WebSocket
- Interfaces with user preference API

## 2. Business Layer

The Business Layer implements the core business logic and workflows of the Collection CRM system.

### 2.1 Customer Management Module

**Responsibilities:**
- Manage customer information
- Handle customer search and retrieval
- Implement skip tracing functionality

**Components:**
- **Customer Service**: Core customer management logic
- **Contact Management Service**: Handles phone, address, and email management
- **Skip Tracing Service**: Implements skip tracing workflows

**Interfaces:**
- Exposes REST APIs for customer operations
- Consumes data from the Data Access Layer

**Pseudocode - Skip Tracing Service:**
```
function addNewContactInfo(customerId, contactType, contactData):
    // Validate customer exists
    customer = customerRepository.findById(customerId)
    if (!customer):
        throw CustomerNotFoundException
    
    // Validate contact data
    if (!validateContactData(contactType, contactData)):
        throw InvalidContactDataException
    
    // Create new contact based on type
    switch (contactType):
        case "PHONE":
            newContact = new Phone(customerId, contactData)
        case "ADDRESS":
            newContact = new Address(customerId, contactData)
        case "EMAIL":
            newContact = new Email(customerId, contactData)
    
    // Save contact
    savedContact = contactRepository.save(newContact)
    
    // Log skip tracing activity
    activityLog = new ActivityLog(
        customerId,
        "SKIP_TRACING",
        "Added new " + contactType,
        getCurrentUser()
    )
    activityLogRepository.save(activityLog)
    
    return savedContact
```

### 2.2 Loan Management Module

**Responsibilities:**
- Manage loan information
- Track loan status and delinquency
- Handle collateral information

**Components:**
- **Loan Service**: Core loan management logic
- **Collateral Service**: Handles collateral information
- **Delinquency Service**: Tracks loan delinquency status

**Interfaces:**
- Exposes REST APIs for loan operations
- Consumes data from the Data Access Layer

### 2.3 Case Management Module

**Responsibilities:**
- Manage collection cases
- Track case status and resolution
- Handle case assignment

**Components:**
- **Case Service**: Core case management logic
- **Assignment Service**: Handles case assignment to agents
- **Resolution Service**: Manages case resolution workflows

**Interfaces:**
- Exposes REST APIs for case operations
- Consumes data from the Data Access Layer

**Pseudocode - Case Assignment Service:**
```
function assignCaseToAgent(caseId, agentId, assignmentType):
    // Validate case exists
    case = caseRepository.findById(caseId)
    if (!case):
        throw CaseNotFoundException
    
    // Validate agent exists and is active
    agent = agentRepository.findById(agentId)
    if (!agent || !agent.isActive):
        throw AgentNotFoundException
    
    // Check agent type matches assignment type
    if (assignmentType == "CALL" && agent.type != "CALL"):
        throw InvalidAssignmentException
    if (assignmentType == "FIELD" && agent.type != "FIELD"):
        throw InvalidAssignmentException
    
    // Update case assignment
    if (assignmentType == "CALL"):
        case.assignedCallAgentId = agentId
    else if (assignmentType == "FIELD"):
        case.assignedFieldAgentId = agentId
    
    // Save updated case
    updatedCase = caseRepository.save(case)
    
    // Create assignment notification
    notification = new Notification(
        agentId,
        "CASE_ASSIGNMENT",
        "You have been assigned to case " + case.caseNumber,
        { caseId: caseId }
    )
    notificationService.send(notification)
    
    // Log assignment activity
    activityLog = new ActivityLog(
        caseId,
        "ASSIGNMENT",
        "Case assigned to " + agent.name,
        getCurrentUser()
    )
    activityLogRepository.save(activityLog)
    
    return updatedCase
```

### 2.4 Action Management Module

**Responsibilities:**
- Record collection actions
- Track action outcomes
- Manage action workflows

**Components:**
- **Action Service**: Core action management logic
- **Outcome Service**: Tracks action outcomes
- **Workflow Service**: Manages action workflows

**Interfaces:**
- Exposes REST APIs for action operations
- Consumes data from the Data Access Layer

**Pseudocode - Action Recording Service:**
```
function recordAction(caseId, actionData):
    // Validate case exists
    case = caseRepository.findById(caseId)
    if (!case):
        throw CaseNotFoundException
    
    // Validate action data
    if (!validateActionData(actionData)):
        throw InvalidActionDataException
    
    // Create action record
    action = new ActionRecord(
        caseId,
        actionData.type,
        actionData.subtype,
        actionData.actionDate,
        actionData.notes,
        getCurrentUser()
    )
    
    // Add type-specific data
    if (actionData.type == "CALL" && actionData.callTraceId):
        action.callTraceId = actionData.callTraceId
    
    if (actionData.type == "VISIT" && actionData.visitLocation):
        action.visitLocation = actionData.visitLocation
    
    // Save action
    savedAction = actionRepository.save(action)
    
    // Update case status based on action outcome
    if (actionData.outcome):
        updateCaseStatus(caseId, actionData.outcome)
    
    // Check if action completes a task
    if (actionData.taskId):
        completeTask(actionData.taskId)
    
    return savedAction
```

### 2.5 Collection Strategy Module

**Responsibilities:**
- Define collection strategies
- Assign strategies to cases
- Generate tasks based on strategies

**Components:**
- **Strategy Service**: Core strategy management logic
- **Rule Engine**: Implements strategy rules
- **Task Generator**: Generates tasks based on strategies

**Interfaces:**
- Exposes REST APIs for strategy operations
- Consumes data from the Data Access Layer

**Pseudocode - Strategy Rule Engine:**
```
function evaluateStrategies(loanId):
    // Get loan details
    loan = loanRepository.findById(loanId)
    if (!loan):
        throw LoanNotFoundException
    
    // Get all active strategies
    strategies = strategyRepository.findAllActive()
    
    // Find matching strategies
    matchingStrategies = []
    
    for strategy in strategies:
        if (evaluateStrategyRules(strategy, loan)):
            matchingStrategies.push(strategy)
    
    // Sort strategies by priority
    matchingStrategies.sort((a, b) => a.priority - b.priority)
    
    // Return highest priority matching strategy
    if (matchingStrategies.length > 0):
        return matchingStrategies[0]
    else:
        return defaultStrategy
```

### 2.6 Payment Tracking Module

**Responsibilities:**
- Track loan payments
- Update payment status
- Reconcile payments with collection actions

**Components:**
- **Payment Service**: Core payment tracking logic
- **Reconciliation Service**: Reconciles payments with actions

**Interfaces:**
- Exposes REST APIs for payment operations
- Consumes data from the Data Access Layer
- Consumes payment events from the Integration Layer

### 2.7 Reporting Module

**Responsibilities:**
- Generate collection reports
- Track performance metrics
- Provide data visualization

**Components:**
- **Report Service**: Core reporting logic
- **Metrics Service**: Tracks performance metrics
- **Visualization Service**: Provides data visualization

**Interfaces:**
- Exposes REST APIs for reporting operations
- Consumes data from the Data Access Layer

## 3. Data Layer

The Data Layer is responsible for data storage, retrieval, and persistence.

### 3.1 Data Access Module

**Responsibilities:**
- Provide data access interfaces
- Implement repository pattern
- Handle data validation

**Components:**
- **Customer Repository**: Handles customer data access
- **Loan Repository**: Handles loan data access
- **Case Repository**: Handles case data access
- **Action Repository**: Handles action data access
- **Payment Repository**: Handles payment data access
- **Strategy Repository**: Handles strategy data access

**Interfaces:**
- Exposes data access interfaces to the Business Layer
- Consumes database services

### 3.2 Database Module

**Responsibilities:**
- Manage database connections
- Handle data persistence
- Implement data partitioning

**Components:**
- **Connection Pool Manager**: Manages database connections
- **Transaction Manager**: Handles database transactions
- **Query Optimizer**: Optimizes database queries

**Interfaces:**
- Exposes database services to the Data Access Module
- Interfaces with the physical database

### 3.3 Caching Module

**Responsibilities:**
- Cache frequently accessed data
- Improve system performance
- Reduce database load

**Components:**
- **Cache Manager**: Manages cache operations
- **Invalidation Service**: Handles cache invalidation
- **Distribution Service**: Manages distributed cache

**Interfaces:**
- Exposes caching services to the Data Access Module
- Interfaces with the cache store

## 4. Integration Layer

The Integration Layer is responsible for integrating with external systems.

### 4.1 ETL Module

**Responsibilities:**
- Extract data from external systems
- Transform data to match internal format
- Load data into the Collection CRM database

**Components:**
- **Extraction Service**: Extracts data from source systems
- **Transformation Service**: Transforms data to match internal format
- **Loading Service**: Loads data into the database

**Interfaces:**
- Interfaces with external systems (T24, W4, LOS)
- Exposes ETL status APIs

**Pseudocode - ETL Process:**
```
function performDailyETL():
    // Extract data from source systems
    customerData = extractCustomerData()
    loanData = extractLoanData()
    caseData = extractCaseData()
    collateralData = extractCollateralData()
    
    // Transform data
    transformedCustomerData = transformCustomerData(customerData)
    transformedLoanData = transformLoanData(loanData)
    transformedCaseData = transformCaseData(caseData)
    transformedCollateralData = transformCollateralData(collateralData)
    
    // Load data
    loadCustomerData(transformedCustomerData)
    loadLoanData(transformedLoanData)
    loadCaseData(transformedCaseData)
    loadCollateralData(transformedCollateralData)
    
    // Log ETL completion
    logETLCompletion()
```

### 4.2 Payment Integration Module

**Responsibilities:**
- Receive real-time payment updates
- Process payment data
- Update payment status

**Components:**
- **Payment Listener**: Listens for payment events
- **Payment Processor**: Processes payment data
- **Status Updater**: Updates payment status

**Interfaces:**
- Interfaces with payment processing system
- Publishes payment events to the system

**Pseudocode - Payment Processing:**
```
function processPaymentUpdate(paymentData):
    // Validate payment data
    if (!validatePaymentData(paymentData)):
        logError("Invalid payment data", paymentData)
        return false
    
    // Check if payment already exists
    existingPayment = paymentRepository.findByReferenceNumber(paymentData.referenceNumber)
    
    if (existingPayment):
        // Update existing payment
        existingPayment.status = paymentData.status
        existingPayment.statusReason = paymentData.statusReason
        existingPayment.updatedAt = getCurrentTimestamp()
        
        updatedPayment = paymentRepository.save(existingPayment)
    else:
        // Create new payment
        newPayment = new Payment(
            paymentData.loanId,
            paymentData.amount,
            paymentData.currency,
            paymentData.paymentDate,
            paymentData.paymentMethod,
            paymentData.referenceNumber,
            paymentData.status,
            paymentData.principalAmount,
            paymentData.interestAmount,
            paymentData.feesAmount,
            paymentData.penaltyAmount,
            paymentData.sourceSystem
        )
        
        updatedPayment = paymentRepository.save(newPayment)
    
    // Publish payment event
    eventPublisher.publish("payment.updated", updatedPayment)
    
    // Update loan balance
    updateLoanBalance(paymentData.loanId)
    
    return true
```

### 4.3 Call Center Integration Module

**Responsibilities:**
- Integrate with call center software
- Provide customer information for calls
- Log call details

**Components:**
- **Customer Lookup Service**: Provides customer information
- **Call Logging Service**: Logs call details

**Interfaces:**
- Exposes APIs for call center integration
- Consumes call center events

### 4.4 Mobile App Integration Module

**Responsibilities:**
- Synchronize data with mobile app
- Process field visit data
- Handle GPS tracking

**Components:**
- **Data Sync Service**: Synchronizes data with mobile app
- **Visit Processing Service**: Processes field visit data
- **GPS Tracking Service**: Handles GPS tracking

**Interfaces:**
- Exposes APIs for mobile app integration
- Consumes mobile app events

## 5. Cross-Cutting Modules

These modules provide services that are used across the entire system.

### 5.1 Authentication and Authorization Module

**Responsibilities:**
- Authenticate users
- Manage user sessions
- Implement role-based access control

**Components:**
- **Authentication Service**: Handles user authentication
- **Session Manager**: Manages user sessions
- **Authorization Service**: Implements access control

**Interfaces:**
- Exposes authentication and authorization APIs
- Interfaces with identity providers

### 5.2 Logging and Monitoring Module

**Responsibilities:**
- Log system events
- Monitor system performance
- Track errors and exceptions

**Components:**
- **Logger Service**: Logs system events
- **Performance Monitor**: Monitors system performance
- **Error Tracker**: Tracks errors and exceptions

**Interfaces:**
- Exposes logging and monitoring APIs
- Interfaces with logging and monitoring tools

### 5.3 Configuration Module

**Responsibilities:**
- Manage system configuration
- Handle feature flags
- Provide configuration APIs

**Components:**
- **Configuration Service**: Manages system configuration
- **Feature Flag Service**: Handles feature flags
- **Environment Service**: Manages environment-specific configuration

**Interfaces:**
- Exposes configuration APIs
- Interfaces with configuration stores

## Module Interactions

### Customer Management Flow

1. User searches for a customer in the Web Portal
2. Web Portal sends request to API Gateway
3. API Gateway routes request to Customer Service
4. Customer Service queries Customer Repository
5. Customer Repository retrieves data from Database
6. Results flow back to the Web Portal for display

### Collection Action Flow

1. Agent records a collection action in the Web Portal
2. Web Portal sends request to API Gateway
3. API Gateway routes request to Action Service
4. Action Service validates and processes the action
5. Action Service updates the Action Repository
6. Action Service notifies the Case Service of the action
7. Case Service updates case status if needed
8. Results flow back to the Web Portal for confirmation

### Payment Processing Flow

1. Payment system sends payment update to Payment Integration Module
2. Payment Integration Module processes the payment data
3. Payment Integration Module updates the Payment Repository
4. Payment Integration Module publishes payment event
5. Payment Service receives payment event
6. Payment Service updates loan balance
7. Notification Module sends notification to relevant users

## Module Dependencies

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Presentation   │────►│    Business     │────►│     Data        │
│  Layer          │◄────│    Layer        │◄────│     Layer       │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │   Integration   │
                        │   Layer         │
                        │                 │
                        └─────────────────┘
                                 │
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │   External      │
                        │   Systems       │
                        │                 │
                        └─────────────────┘
```

## Module Extension Points

Each module provides extension points to allow for future enhancements:

1. **Customer Management Module**:
   - Custom customer attributes
   - Additional contact types
   - Enhanced skip tracing workflows

2. **Loan Management Module**:
   - New loan product types
   - Additional loan attributes
   - Enhanced collateral tracking

3. **Case Management Module**:
   - Custom case workflows
   - Additional case statuses
   - Enhanced assignment algorithms

4. **Action Management Module**:
   - New action types
   - Custom action workflows
   - Enhanced outcome tracking

5. **Collection Strategy Module**:
   - Custom strategy rules
   - Enhanced task generation
   - Advanced prioritization algorithms

6. **Integration Layer**:
   - Additional external system integrations
   - Enhanced data transformation
   - Real-time integration capabilities