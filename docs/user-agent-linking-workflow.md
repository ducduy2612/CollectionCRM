# User-Agent Linking Workflow Design

## Overview

This document outlines the high-level architecture and workflow for linking users (managed in auth-service) to agents (managed in collection-workflow-service) in the Collexis system.

## Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Application"
        UI[User Interface]
    end
    
    subgraph "API Gateway"
        GW[Request Router & Composer]
    end
    
    subgraph "Auth Service"
        AU[User Management]
        AT[Authentication]
        AR[Authorization]
    end
    
    subgraph "Collection Workflow Service"
        AG[Agent Management]
        AC[Action Recording]
        AS[Customer Assignment]
    end
    
    subgraph "Database Layer"
        ADB[(Auth DB)]
        WDB[(Workflow DB)]
    end
    
    UI --> GW
    GW --> AU
    GW --> AT
    GW --> AR
    GW --> AG
    GW --> AC
    GW --> AS
    AU --> ADB
    AT --> ADB
    AR --> ADB
    AG --> WDB
    AC --> WDB
    AS --> WDB
    
    AG -.->|References| AU
```

## Data Relationship Model

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar role
        boolean is_active
    }
    
    WORKFLOW_AGENTS {
        uuid id PK
        uuid user_id FK "References AUTH_USERS.id"
        varchar employee_id UK
        varchar name
        varchar email
        varchar type
        varchar team
        boolean is_active
    }
    
    CUSTOMER_ASSIGNMENTS {
        uuid id PK
        varchar cif
        uuid assigned_call_agent_id FK
        uuid assigned_field_agent_id FK
    }
    
    ACTION_RECORDS {
        uuid id PK
        varchar cif
        uuid agent_id FK
        varchar type
        varchar action_result
        timestamp action_date
    }
    
    AUTH_USERS ||--o| WORKFLOW_AGENTS : "links to"
    WORKFLOW_AGENTS ||--o{ CUSTOMER_ASSIGNMENTS : "assigned as call agent"
    WORKFLOW_AGENTS ||--o{ CUSTOMER_ASSIGNMENTS : "assigned as field agent"
    WORKFLOW_AGENTS ||--o{ ACTION_RECORDS : "records actions"
```

## Core Workflow Processes

### 1. User Authentication & Agent Profile Loading

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant G as API Gateway
    participant A as Auth Service
    participant W as Workflow Service
    
    U->>F: Login Request
    F->>G: POST /auth/login
    G->>A: Authenticate User
    A-->>G: JWT Token + User Data
    G->>W: GET /agents/by-user/{userId}
    W-->>G: Agent Profile
    G-->>F: Combined User + Agent Data
    F-->>U: Dashboard with Agent Context
```

### 2. Agent Management Workflow

```mermaid
flowchart TD
    A[Create User Account] --> B{User Role?}
    B -->|AGENT| C[Create Agent Profile]
    B -->|SUPERVISOR| D[Create Supervisor Profile]
    B -->|ADMIN| E[Admin Access Only]
    
    C --> F[Link User ID to Agent]
    D --> F
    
    F --> G[Assign to Team]
    G --> H[Set Agent Permissions]
    H --> I[Activate Agent]
    
    I --> J{Agent Type?}
    J -->|CALL_AGENT| K[Enable Call Functions]
    J -->|FIELD_AGENT| L[Enable Field Functions]
    J -->|BOTH| M[Enable All Functions]
    
    K --> N[Ready for Customer Assignment]
    L --> N
    M --> N
```

### 3. Customer Assignment Process

```mermaid
flowchart LR
    A[Customer Needs Collection] --> B[Determine Strategy]
    B --> C{Assignment Type}
    
    C -->|Call Only| D[Assign Call Agent]
    C -->|Field Only| E[Assign Field Agent]
    C -->|Both| F[Assign Both Agents]
    
    D --> G[Update Customer Assignment]
    E --> G
    F --> G
    
    G --> H[Notify Assigned Agents]
    H --> I[Agents Begin Collection Activities]
```

### 4. Action Recording Workflow

```mermaid
sequenceDiagram
    participant A as Agent
    participant F as Frontend
    participant G as API Gateway
    participant W as Workflow Service
    participant D as Database
    
    A->>F: Record Collection Action
    F->>G: POST /collection/actions
    G->>G: Validate JWT & Extract User ID
    G->>W: Create Action Record
    W->>D: Store Action with Agent ID
    D-->>W: Confirmation
    W-->>G: Action Created
    G-->>F: Success Response
    F-->>A: Action Recorded
```

## Key Design Principles

### 1. Service Separation
- **Auth Service**: Manages users, authentication, and authorization
- **Workflow Service**: Manages agents, actions, and collection processes
- **API Gateway**: Orchestrates requests and composes responses

### 2. Data Linking Strategy
- **Primary Link**: `workflow_service.agents.user_id` → `auth_service.users.id`
- **Referential Integrity**: Foreign key constraint ensures data consistency
- **Single Source of Truth**: User data in auth-service, agent data in workflow-service

### 3. Communication Patterns
- **Synchronous**: Direct API calls for real-time operations
- **Asynchronous**: Event-driven updates for data consistency
- **Composition**: API Gateway combines data from multiple services

## Operational Workflows

### User Onboarding
1. HR creates user account in auth-service
2. System administrator creates corresponding agent profile
3. Agent profile automatically links to user via user_id
4. Agent receives credentials and can begin work

### Daily Operations
1. Agent logs in through auth-service
2. System loads agent profile from workflow-service
3. Agent sees assigned customers and pending actions
4. All collection activities are recorded with agent context

### Performance Tracking
1. Actions are recorded with agent_id reference
2. Performance metrics calculated from action records
3. Reports show both user and agent information
4. Supervisors can track team performance

## Security & Access Control

### Authentication Flow
- Users authenticate through auth-service
- JWT tokens contain user ID and roles
- Workflow-service validates agent permissions

### Authorization Model
- Role-based access control (RBAC)
- Agent-level permissions for specific functions
- Team-based data access restrictions

## Benefits of This Design

1. **Simplicity**: Direct foreign key relationship
2. **Performance**: Minimal cross-service calls
3. **Consistency**: Single source of truth for each data type
4. **Scalability**: Services can scale independently
5. **Maintainability**: Clear separation of concerns
6. **Flexibility**: Easy to extend with additional agent types

## Implementation Considerations

### Database Changes
- Add `user_id` column to agents table
- Create foreign key constraint
- Index for performance optimization

### API Updates
- New endpoints for user-agent linking
- Enhanced authentication responses
- Agent profile retrieval by user ID

### Service Integration
- Cross-service data validation
- Event-driven consistency updates
- Error handling for service failures

This design provides a robust, scalable foundation for managing the relationship between users and agents while maintaining the benefits of microservices architecture.