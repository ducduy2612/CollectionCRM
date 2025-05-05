# Collection Workflow Microservice API Contract

## Overview

This document defines the API contract for the Collection Workflow Microservice, which is responsible for managing the collection process workflow, including agent management, action tracking, customer assignments, and case management.

## Base URL

```
/api/v1/collection
```

## Authentication

All API endpoints require authentication using JWT tokens. The token must be included in the `Authorization` header using the Bearer scheme.

```
Authorization: Bearer <token>
```

## Common Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - The request was successful |
| 201 | Created - The resource was successfully created |
| 400 | Bad Request - The request was invalid or cannot be served |
| 401 | Unauthorized - Authentication is required or failed |
| 403 | Forbidden - The user does not have permission to access the resource |
| 404 | Not Found - The resource was not found |
| 409 | Conflict - The request conflicts with the current state of the resource |
| 500 | Internal Server Error - An error occurred on the server |

## Common Response Format

All responses follow a standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "errors": []
}
```

For error responses:

```json
{
  "success": false,
  "data": null,
  "message": "Operation failed",
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Detailed error message"
    }
  ]
}
```

## API Endpoints

### Agent Management

#### List Agents

Retrieves a list of collection agents.

**Endpoint:** `GET /agents`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by agent type (AGENT, SUPERVISOR, ADMIN) |
| team | string | No | Filter by team |
| isActive | boolean | No | Filter by active status |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "AGT123456",
        "employeeId": "EMP123456",
        "name": "John Smith",
        "email": "john.smith@example.com",
        "phone": "+84123456789",
        "type": "AGENT",
        "team": "FIELD_TEAM_1",
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Agents retrieved successfully",
  "errors": []
}
```

#### Create Agent

Creates a new collection agent.

**Endpoint:** `POST /agents`

**Request Body:**

```json
{
  "employeeId": "EMP123456",
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+84123456789",
  "type": "AGENT",
  "team": "FIELD_TEAM_1"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "AGT123456",
    "employeeId": "EMP123456",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "+84123456789",
    "type": "AGENT",
    "team": "FIELD_TEAM_1",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "message": "Agent created successfully",
  "errors": []
}
```

#### Update Agent

Updates an existing collection agent.

**Endpoint:** `PUT /agents/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Agent ID |

**Request Body:**

```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+84123456789",
  "type": "SUPERVISOR",
  "team": "FIELD_TEAM_1",
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "AGT123456",
    "employeeId": "EMP123456",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "+84123456789",
    "type": "SUPERVISOR",
    "team": "FIELD_TEAM_1",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T01:00:00Z"
  },
  "message": "Agent updated successfully",
  "errors": []
}
```

#### Get Agent Performance

Retrieves performance metrics for a specific agent.

**Endpoint:** `GET /agents/{id}/performance`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Agent ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string (date) | No | Start date for performance period (YYYY-MM-DD) |
| endDate | string (date) | No | End date for performance period (YYYY-MM-DD) |

**Response:**

```json
{
  "success": true,
  "data": {
    "agentId": "AGT123456",
    "agentName": "John Smith",
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    },
    "metrics": {
      "totalActions": 120,
      "successfulActions": 95,
      "callsPlaced": 80,
      "callsConnected": 65,
      "visitsCompleted": 40,
      "paymentsCollected": 30,
      "totalAmountCollected": 150000.00,
      "averageCallDuration": 180,
      "successRate": 79.17
    },
    "trends": {
      "daily": [
        {
          "date": "2025-01-01",
          "actions": 4,
          "amountCollected": 5000.00
        }
      ],
      "weekly": [
        {
          "week": "2025-W01",
          "actions": 28,
          "amountCollected": 35000.00
        }
      ]
    }
  },
  "message": "Agent performance retrieved successfully",
  "errors": []
}
```

### Action Management

#### Record Action

Records a collection action.

**Endpoint:** `POST /actions`

**Request Body:**

```json
{
  "cif": "C123456789",
  "loanAccountNumber": "L987654321",
  "type": "CALL",
  "subtype": "REMINDER_CALL",
  "actionResult": "PROMISE_TO_PAY",
  "actionDate": "2025-01-15T10:30:00Z",
  "notes": "Customer promised to pay by the end of the week",
  "callTraceId": "CALL123456",
  "visitLocation": {
    "latitude": 21.0278,
    "longitude": 105.8342,
    "address": "123 Main St, Hanoi, Vietnam"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ACT123456",
    "cif": "C123456789",
    "loanAccountNumber": "L987654321",
    "type": "CALL",
    "subtype": "REMINDER_CALL",
    "actionResult": "PROMISE_TO_PAY",
    "actionDate": "2025-01-15T10:30:00Z",
    "notes": "Customer promised to pay by the end of the week",
    "callTraceId": "CALL123456",
    "visitLocation": {
      "latitude": 21.0278,
      "longitude": 105.8342,
      "address": "123 Main St, Hanoi, Vietnam"
    },
    "createdAt": "2025-01-15T10:35:00Z",
    "updatedAt": "2025-01-15T10:35:00Z",
    "createdBy": "AGT123456",
    "updatedBy": "AGT123456"
  },
  "message": "Action recorded successfully",
  "errors": []
}
```

#### Get Customer Actions

Retrieves actions associated with a customer.

**Endpoint:** `GET /actions/customer/{cif}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Customer CIF number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by action type |
| startDate | string (date) | No | Filter by start date (YYYY-MM-DD) |
| endDate | string (date) | No | Filter by end date (YYYY-MM-DD) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": "ACT123456",
        "cif": "C123456789",
        "loanAccountNumber": "L987654321",
        "type": "CALL",
        "subtype": "REMINDER_CALL",
        "actionResult": "PROMISE_TO_PAY",
        "actionDate": "2025-01-15T10:30:00Z",
        "notes": "Customer promised to pay by the end of the week",
        "callTraceId": "CALL123456",
        "createdAt": "2025-01-15T10:35:00Z",
        "createdBy": "AGT123456",
        "agentName": "John Smith"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Customer actions retrieved successfully",
  "errors": []
}
```

#### Get Loan Actions

Retrieves actions associated with a loan.

**Endpoint:** `GET /actions/loan/{accountNumber}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountNumber | string | Yes | Loan account number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by action type |
| startDate | string (date) | No | Filter by start date (YYYY-MM-DD) |
| endDate | string (date) | No | Filter by end date (YYYY-MM-DD) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": "ACT123456",
        "cif": "C123456789",
        "loanAccountNumber": "L987654321",
        "type": "CALL",
        "subtype": "REMINDER_CALL",
        "actionResult": "PROMISE_TO_PAY",
        "actionDate": "2025-01-15T10:30:00Z",
        "notes": "Customer promised to pay by the end of the week",
        "callTraceId": "CALL123456",
        "createdAt": "2025-01-15T10:35:00Z",
        "createdBy": "AGT123456",
        "agentName": "John Smith"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Loan actions retrieved successfully",
  "errors": []
}
```

#### Update Action Result

Updates the result of a collection action.

**Endpoint:** `PUT /actions/{id}/result`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Action ID |

**Request Body:**

```json
{
  "actionResult": "PAYMENT_MADE",
  "notes": "Customer made a payment of 1000 VND"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ACT123456",
    "cif": "C123456789",
    "loanAccountNumber": "L987654321",
    "type": "CALL",
    "subtype": "REMINDER_CALL",
    "actionResult": "PAYMENT_MADE",
    "actionDate": "2025-01-15T10:30:00Z",
    "notes": "Customer made a payment of 1000 VND",
    "callTraceId": "CALL123456",
    "createdAt": "2025-01-15T10:35:00Z",
    "updatedAt": "2025-01-15T11:00:00Z",
    "createdBy": "AGT123456",
    "updatedBy": "AGT123456"
  },
  "message": "Action result updated successfully",
  "errors": []
}
```

### Customer Assignment Management

#### Get Agent Assignments

Retrieves customers assigned to a specific agent.

**Endpoint:** `GET /assignments/agent/{agentId}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agentId | string | Yes | Agent ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "ASG123456",
        "cif": "C123456789",
        "customerName": "John Doe",
        "assignedCallAgentId": "AGT123456",
        "assignedFieldAgentId": "AGT654321",
        "startDate": "2025-01-01T00:00:00Z",
        "isCurrent": true,
        "customerStatus": "ACTIVE",
        "collateralStatus": "SECURED",
        "processingStateStatus": "IN_PROCESS",
        "lendingViolationStatus": "NONE",
        "recoveryAbilityStatus": "HIGH"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Agent assignments retrieved successfully",
  "errors": []
}
```

#### Create Assignment

Assigns a customer to an agent.

**Endpoint:** `POST /assignments`

**Request Body:**

```json
{
  "cif": "C123456789",
  "assignedCallAgentId": "AGT123456",
  "assignedFieldAgentId": "AGT654321"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ASG123456",
    "cif": "C123456789",
    "assignedCallAgentId": "AGT123456",
    "assignedFieldAgentId": "AGT654321",
    "startDate": "2025-01-15T00:00:00Z",
    "isCurrent": true
  },
  "message": "Assignment created successfully",
  "errors": []
}
```

#### Update Assignment

Updates an existing customer assignment.

**Endpoint:** `PUT /assignments/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assignment ID |

**Request Body:**

```json
{
  "assignedCallAgentId": "AGT789012",
  "assignedFieldAgentId": "AGT654321"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ASG123456",
    "cif": "C123456789",
    "assignedCallAgentId": "AGT789012",
    "assignedFieldAgentId": "AGT654321",
    "startDate": "2025-01-15T00:00:00Z",
    "isCurrent": true
  },
  "message": "Assignment updated successfully",
  "errors": []
}
```

#### Get Assignment History

Retrieves the assignment history for a customer.

**Endpoint:** `GET /assignments/history/{cif}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Customer CIF number |

**Response:**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "ASG123456",
        "cif": "C123456789",
        "assignedCallAgentId": "AGT789012",
        "assignedCallAgentName": "Jane Smith",
        "assignedFieldAgentId": "AGT654321",
        "assignedFieldAgentName": "Mike Johnson",
        "startDate": "2025-01-15T00:00:00Z",
        "endDate": null,
        "isCurrent": true
      },
      {
        "id": "ASG123455",
        "cif": "C123456789",
        "assignedCallAgentId": "AGT123456",
        "assignedCallAgentName": "John Smith",
        "assignedFieldAgentId": "AGT654321",
        "assignedFieldAgentName": "Mike Johnson",
        "startDate": "2025-01-01T00:00:00Z",
        "endDate": "2025-01-15T00:00:00Z",
        "isCurrent": false
      }
    ]
  },
  "message": "Assignment history retrieved successfully",
  "errors": []
}
```

### Case Management

#### Get Customer Case History

Retrieves the case history for a customer.

**Endpoint:** `GET /cases/customer/{cif}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Customer CIF number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string (date) | No | Filter by start date (YYYY-MM-DD) |
| endDate | string (date) | No | Filter by end date (YYYY-MM-DD) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "caseActions": [
      {
        "id": "CAS123456",
        "cif": "C123456789",
        "actionDate": "2025-01-15T10:30:00Z",
        "notes": "Customer promised to pay by the end of the week",
        "customerStatus": "COOPERATIVE",
        "collateralStatus": "SECURED",
        "processingStateStatus": "IN_PROCESS",
        "lendingViolationStatus": "NONE",
        "recoveryAbilityStatus": "HIGH",
        "createdAt": "2025-01-15T10:35:00Z",
        "createdBy": "AGT123456",
        "agentName": "John Smith"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Customer case history retrieved successfully",
  "errors": []
}
```

#### Record Case Action

Records a case action for a customer.

**Endpoint:** `POST /cases`

**Request Body:**

```json
{
  "cif": "C123456789",
  "actionDate": "2025-01-15T10:30:00Z",
  "notes": "Customer promised to pay by the end of the week",
  "customerStatus": "COOPERATIVE",
  "collateralStatus": "SECURED",
  "processingStateStatus": "IN_PROCESS",
  "lendingViolationStatus": "NONE",
  "recoveryAbilityStatus": "HIGH"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "CAS123456",
    "cif": "C123456789",
    "actionDate": "2025-01-15T10:30:00Z",
    "notes": "Customer promised to pay by the end of the week",
    "customerStatus": "COOPERATIVE",
    "collateralStatus": "SECURED",
    "processingStateStatus": "IN_PROCESS",
    "lendingViolationStatus": "NONE",
    "recoveryAbilityStatus": "HIGH",
    "createdAt": "2025-01-15T10:35:00Z",
    "updatedAt": "2025-01-15T10:35:00Z",
    "createdBy": "AGT123456",
    "updatedBy": "AGT123456"
  },
  "message": "Case action recorded successfully",
  "errors": []
}
```

#### Get Customer Case Status

Retrieves the current case status for a customer.

**Endpoint:** `GET /cases/status/{cif}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Customer CIF number |

**Response:**

```json
{
  "success": true,
  "data": {
    "cif": "C123456789",
    "customerName": "John Doe",
    "assignedCallAgentId": "AGT789012",
    "assignedCallAgentName": "Jane Smith",
    "assignedFieldAgentId": "AGT654321",
    "assignedFieldAgentName": "Mike Johnson",
    "fUpdate": "2025-01-15T10:30:00Z",
    "customerStatus": "COOPERATIVE",
    "collateralStatus": "SECURED",
    "processingStateStatus": "IN_PROCESS",
    "lendingViolationStatus": "NONE",
    "recoveryAbilityStatus": "HIGH",
    "lastActionDate": "2025-01-15T10:30:00Z",
    "lastActionType": "CALL",
    "lastActionResult": "PROMISE_TO_PAY"
  },
  "message": "Customer case status retrieved successfully",
  "errors": []
}
```

## Data Models

### Agent

```json
{
  "id": "string",
  "employeeId": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "type": "AGENT | SUPERVISOR | ADMIN",
  "team": "string",
  "isActive": "boolean",
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)"
}
```

### ActionRecord

```json
{
  "id": "string",
  "cif": "string",
  "loanAccountNumber": "string",
  "type": "string",
  "subtype": "string",
  "actionResult": "string",
  "actionDate": "string (date-time)",
  "notes": "string",
  "callTraceId": "string",
  "visitLocation": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)",
  "createdBy": "string",
  "updatedBy": "string"
}
```

### CustomerAgent

```json
{
  "id": "string",
  "cif": "string",
  "assignedCallAgentId": "string",
  "assignedFieldAgentId": "string",
  "startDate": "string (date-time)",
  "endDate": "string (date-time)",
  "isCurrent": "boolean"
}
```

### CustomerCase

```json
{
  "id": "string",
  "cif": "string",
  "assignedCallAgentId": "string",
  "assignedFieldAgentId": "string",
  "fUpdate": "string (date-time)",
  "customerStatus": "string",
  "collateralStatus": "string",
  "processingStateStatus": "string",
  "lendingViolationStatus": "string",
  "recoveryAbilityStatus": "string"
}
```

### CustomerCaseAction

```json
{
  "id": "string",
  "cif": "string",
  "actionDate": "string (date-time)",
  "notes": "string",
  "customerStatus": "string",
  "collateralStatus": "string",
  "processingStateStatus": "string",
  "lendingViolationStatus": "string",
  "recoveryAbilityStatus": "string",
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)",
  "createdBy": "string",
  "updatedBy": "string"
}
```

### AgentPerformance

```json
{
  "agentId": "string",
  "agentName": "string",
  "period": {
    "startDate": "string (date)",
    "endDate": "string (date)"
  },
  "metrics": {
    "totalActions": "integer",
    "successfulActions": "integer",
    "callsPlaced": "integer",
    "callsConnected": "integer",
    "visitsCompleted": "integer",
    "paymentsCollected": "integer",
    "totalAmountCollected": "number",
    "averageCallDuration": "integer",
    "successRate": "number"
  },
  "trends": {
    "daily": [
      {
        "date": "string (date)",
        "actions": "integer",
        "amountCollected": "number"
      }
    ],
    "weekly": [
      {
        "week": "string",
        "actions": "integer",
        "amountCollected": "number"
      }
    ]
  }
}
```

### Pagination

```json
{
  "page": "integer",
  "pageSize": "integer",
  "totalPages": "integer",
  "totalItems": "integer"
}