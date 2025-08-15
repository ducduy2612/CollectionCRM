# System Architecture

## System Boundaries

The Collexis system operates within the following boundaries:

1. **Internal Systems**:
   - Core Collexis application
   - Data warehouse for reporting and analytics
   - Authentication and authorization service

2. **External Systems**:
   - T24 Core Banking System (source of customer and loan data)
   - W4 System (source of case tracking data)
   - LOS (Loan Origination System)
   - Payment Processing System (real-time payment updates)
   - Call Center Software
   - GPS Tracking System

3. **User Interfaces**:
   - Web Application for office agents

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Collexis System                              │
│                                                                             │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────────────┐    │
│  │               │      │               │      │                       │    │
│  │  Web Portal   │◄────►│  API Gateway  │◄────►│  Authentication &     │    │
│  │  (Office UI)  │      │               │      │  Authorization        │    │
│  │               │      │               │      │                       │    │
│  └───────────────┘      └───────┬───────┘      └───────────────────────┘    │
│                                 │                                            │
│                         ┌───────┴───────┐                                    │
│                         │               │                                    │
│                         │  Application  │                                    │
│                         │  Services     │                                    │
│                         │               │                                    │
│                         └───────┬───────┘                                    │
│                                 │                                            │
│  ┌───────────────┐      ┌───────┴───────┐      ┌───────────────────────┐    │
│  │               │      │               │      │                       │    │
│  │  Data Access  │◄────►│  Database     │◄────►│  ETL & Integration    │    │
│  │  Layer        │      │  Layer        │      │  Services             │    │
│  │               │      │               │      │                       │    │
│  └───────────────┘      └───────────────┘      └───────────┬───────────┘    │
│                                                            │                │
└────────────────────────────────────────────────────────────┼────────────────┘
                                                             │
                                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Systems                                   │
│                                                                             │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────────────┐    │
│  │               │      │               │      │                       │    │
│  │  T24 Core     │      │  W4 System    │      │  LOS System           │    │
│  │  Banking      │      │               │      │                       │    │
│  │               │      │               │      │                       │    │
│  └───────────────┘      └───────────────┘      └───────────────────────┘    │
│                                                                             │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────────────┐    │
│  │               │      │               │      │                       │    │
│  │  Payment      │      │  Call Center  │      │  GPS Tracking         │    │
│  │  Processing   │      │  Software     │      │  System               │    │
│  │               │      │               │      │                       │    │
│  └───────────────┘      └───────────────┘      └───────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. Web Portal (Office UI)
- Provides the user interface for office agents
- Implements responsive design for use on various devices
- Renders dashboards, customer information, and collection workflows

### 2. API Gateway
- Serves as the entry point for all client requests
- Handles request routing, composition, and protocol translation
- Implements rate limiting, authentication, and monitoring

### 3. Authentication & Authorization
- Manages user authentication and session management
- Implements role-based access control (RBAC)
- Integrates with enterprise identity providers if needed

### 4. Application Services
- Implements core business logic and workflows
- Divided into domain-specific services:
  - Customer Management Service
  - Loan Management Service
  - Collection Strategy Service
  - Task Management Service
  - Action Recording Service
  - Payment Tracking Service

### 5. Data Access Layer
- Provides abstraction over database operations
- Implements repository pattern for entity access
- Handles data validation and transformation

### 6. Database Layer
- Stores all application data
- Implements data partitioning for performance
- Manages data integrity and relationships

### 7. ETL & Integration Services
- Handles data synchronization with external systems
- Implements ETL processes for T24, W4, and LOS
- Provides real-time integration with payment systems
- Integrates with call center software and GPS tracking

## Data Flow

1. **Customer and Loan Data Flow**:
   - Daily ETL processes extract data from T24, W4, and LOS
   - Data is transformed and loaded into the Collexis database
   - Changes to contact information in CRM are not synchronized back to source systems

2. **Payment Data Flow**:
   - Real-time payment updates are received from the Payment Processing System
   - Payment data is processed and stored in the Collexis database
   - Payment status is reflected in customer accounts and collection tasks

3. **Collection Activity Flow**:
   - Collection strategies determine tasks for agents
   - Agents record actions and outcomes in the system
   - Task completion and outcomes feed back into strategy determination

4. **Integration Flow**:
   - Call center interactions are logged via integration API
   - GPS tracking data is received and associated with field visits
   - System provides APIs for external systems to query collection status