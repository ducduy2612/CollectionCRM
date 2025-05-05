# Authentication Microservice API Contract

## Overview

This document defines the API contract for the Authentication Microservice, which is responsible for managing user authentication, authorization, and session management by integrating with the bank's Active Directory system.

## Base URL

```
/api/v1/auth
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

### Authentication Operations

#### Login

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /login`

**Request Body:**

```json
{
  "username": "john.doe",
  "password": "password123",
  "deviceInfo": {
    "deviceId": "device-123",
    "deviceType": "DESKTOP",
    "browser": "Chrome",
    "operatingSystem": "Windows",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "USR123456",
      "username": "john.doe",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "roles": ["AGENT"],
      "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-01-15T12:30:00Z"
  },
  "message": "Login successful",
  "errors": []
}
```

#### Logout

Logs out a user and invalidates their session.

**Endpoint:** `POST /logout`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionTerminated": true
  },
  "message": "Logout successful",
  "errors": []
}
```

#### Refresh Token

Refreshes an expired JWT token using a refresh token.

**Endpoint:** `POST /token/refresh`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-01-15T14:30:00Z"
  },
  "message": "Token refreshed successfully",
  "errors": []
}
```

#### Validate Token

Validates a JWT token and returns user information.

**Endpoint:** `POST /token/validate`

**Request Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "USR123456",
      "username": "john.doe",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "roles": ["AGENT"],
      "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS"]
    }
  },
  "message": "Token is valid",
  "errors": []
}
```

#### Request Password Reset

Requests a password reset for a user.

**Endpoint:** `POST /password/reset`

**Request Body:**

```json
{
  "username": "john.doe",
  "email": "john.doe@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "resetRequested": true,
    "resetTokenExpiry": "2025-01-15T12:30:00Z"
  },
  "message": "Password reset requested successfully",
  "errors": []
}
```

#### Change Password

Changes a user's password.

**Endpoint:** `POST /password/change`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "passwordChanged": true
  },
  "message": "Password changed successfully",
  "errors": []
}
```

### User Management Operations

#### List Users

Retrieves a list of users.

**Endpoint:** `GET /users`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | No | Filter by username (partial match) |
| email | string | No | Filter by email (partial match) |
| role | string | No | Filter by role |
| isActive | boolean | No | Filter by active status |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "USR123456",
        "username": "john.doe",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "roles": ["AGENT"],
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
  "message": "Users retrieved successfully",
  "errors": []
}
```

#### Create User

Creates a new user.

**Endpoint:** `POST /users`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "username": "jane.smith",
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "password123",
  "roles": ["AGENT"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "USR123457",
    "username": "jane.smith",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "roles": ["AGENT"],
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "message": "User created successfully",
  "errors": []
}
```

#### Get User by ID

Retrieves a user by ID.

**Endpoint:** `GET /users/{id}`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "USR123456",
    "username": "john.doe",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "roles": ["AGENT"],
    "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS"],
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "lastLogin": "2025-01-15T10:00:00Z"
  },
  "message": "User retrieved successfully",
  "errors": []
}
```

#### Update User

Updates an existing user.

**Endpoint:** `PUT /users/{id}`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Request Body:**

```json
{
  "name": "John Doe Jr.",
  "email": "john.doe.jr@example.com",
  "roles": ["SUPERVISOR"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "USR123456",
    "username": "john.doe",
    "name": "John Doe Jr.",
    "email": "john.doe.jr@example.com",
    "roles": ["SUPERVISOR"],
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T11:00:00Z"
  },
  "message": "User updated successfully",
  "errors": []
}
```

#### Activate User

Activates a deactivated user.

**Endpoint:** `PUT /users/{id}/activate`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "USR123456",
    "username": "john.doe",
    "isActive": true,
    "updatedAt": "2025-01-15T11:30:00Z"
  },
  "message": "User activated successfully",
  "errors": []
}
```

#### Deactivate User

Deactivates an active user.

**Endpoint:** `PUT /users/{id}/deactivate`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "USR123456",
    "username": "john.doe",
    "isActive": false,
    "updatedAt": "2025-01-15T11:30:00Z"
  },
  "message": "User deactivated successfully",
  "errors": []
}
```

#### Get User Sessions

Retrieves active sessions for a user.

**Endpoint:** `GET /users/{id}/sessions`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "SES123456",
        "userId": "USR123456",
        "deviceInfo": {
          "deviceId": "device-123",
          "deviceType": "DESKTOP",
          "browser": "Chrome",
          "operatingSystem": "Windows",
          "ipAddress": "192.168.1.1",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        "createdAt": "2025-01-15T10:00:00Z",
        "lastActivityAt": "2025-01-15T11:30:00Z",
        "expiresAt": "2025-01-15T12:00:00Z"
      }
    ]
  },
  "message": "User sessions retrieved successfully",
  "errors": []
}
```

#### Terminate User Sessions

Terminates all active sessions for a user.

**Endpoint:** `DELETE /users/{id}/sessions`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "terminatedSessions": 1
  },
  "message": "User sessions terminated successfully",
  "errors": []
}
```

### Role Management Operations

#### List Roles

Retrieves a list of roles.

**Endpoint:** `GET /roles`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "ROLE123456",
        "name": "AGENT",
        "description": "Collection agent role",
        "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS"],
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      },
      {
        "id": "ROLE123457",
        "name": "SUPERVISOR",
        "description": "Team supervisor role",
        "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS", "MANAGE_AGENTS", "VIEW_REPORTS"],
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      },
      {
        "id": "ROLE123458",
        "name": "ADMIN",
        "description": "System administrator role",
        "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS", "MANAGE_AGENTS", "VIEW_REPORTS", "MANAGE_USERS", "MANAGE_ROLES"],
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ]
  },
  "message": "Roles retrieved successfully",
  "errors": []
}
```

#### Create Role

Creates a new role.

**Endpoint:** `POST /roles`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "TEAM_LEAD",
  "description": "Team leader role",
  "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS", "MANAGE_AGENTS", "VIEW_REPORTS"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ROLE123459",
    "name": "TEAM_LEAD",
    "description": "Team leader role",
    "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS", "MANAGE_AGENTS", "VIEW_REPORTS"],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "message": "Role created successfully",
  "errors": []
}
```

#### Get Role by ID

Retrieves a role by ID.

**Endpoint:** `GET /roles/{id}`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Role ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ROLE123456",
    "name": "AGENT",
    "description": "Collection agent role",
    "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS"],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "message": "Role retrieved successfully",
  "errors": []
}
```

#### Update Role

Updates an existing role.

**Endpoint:** `PUT /roles/{id}`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Role ID |

**Request Body:**

```json
{
  "description": "Updated collection agent role",
  "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS", "VIEW_REPORTS"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ROLE123456",
    "name": "AGENT",
    "description": "Updated collection agent role",
    "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS", "VIEW_REPORTS"],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T11:00:00Z"
  },
  "message": "Role updated successfully",
  "errors": []
}
```

#### Delete Role

Deletes a role.

**Endpoint:** `DELETE /roles/{id}`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Role ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ROLE123456",
    "deleted": true
  },
  "message": "Role deleted successfully",
  "errors": []
}
```

#### Get Users with Role

Retrieves users assigned to a specific role.

**Endpoint:** `GET /roles/{id}/users`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Role ID |

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
    "users": [
      {
        "id": "USR123456",
        "username": "john.doe",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Users with role retrieved successfully",
  "errors": []
}
```

#### Assign Role to Users

Assigns a role to multiple users.

**Endpoint:** `POST /roles/{id}/users`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Role ID |

**Request Body:**

```json
{
  "userIds": ["USR123456", "USR123457"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "roleId": "ROLE123456",
    "assignedUsers": 2
  },
  "message": "Role assigned to users successfully",
  "errors": []
}
```

### Audit Operations

#### Search Audit Logs

Searches audit logs based on criteria.

**Endpoint:** `GET /audit/logs`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | No | Filter by user ID |
| username | string | No | Filter by username |
| eventType | string | No | Filter by event type (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.) |
| startDate | string (date-time) | No | Filter by start date (ISO 8601 format) |
| endDate | string (date-time) | No | Filter by end date (ISO 8601 format) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "LOG123456",
        "eventType": "LOGIN_SUCCESS",
        "userId": "USR123456",
        "username": "john.doe",
        "action": "AUTHENTICATE",
        "status": "SUCCESS",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "details": {
          "deviceType": "DESKTOP",
          "browser": "Chrome",
          "operatingSystem": "Windows"
        },
        "timestamp": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Audit logs retrieved successfully",
  "errors": []
}
```

#### Generate Audit Report

Generates an audit report based on criteria.

**Endpoint:** `GET /audit/reports`

**Request Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reportType | string | Yes | Type of report (USER_ACTIVITY, SECURITY_EVENTS, ROLE_CHANGES) |
| startDate | string (date) | Yes | Start date for the report (YYYY-MM-DD) |
| endDate | string (date) | Yes | End date for the report (YYYY-MM-DD) |
| format | string | No | Report format (PDF, CSV, JSON) (default: PDF) |

**Response:**

For PDF and CSV formats, the response will be a binary file with appropriate headers:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="audit-report-2025-01-15.pdf"
```

For JSON format:

```json
{
  "success": true,
  "data": {
    "reportId": "REP123456",
    "reportType": "USER_ACTIVITY",
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-15"
    },
    "summary": {
      "totalEvents": 1000,
      "loginEvents": 500,
      "logoutEvents": 450,
      "failedLoginAttempts": 50,
      "userCreationEvents": 5,
      "roleChangeEvents": 10
    },
    "details": [
      {
        "date": "2025-01-01",
        "events": 65,
        "uniqueUsers": 30
      }
    ]
  },
  "message": "Audit report generated successfully",
  "errors": []
}
```

## Data Models

### User

```json
{
  "id": "string",
  "username": "string",
  "name": "string",
  "email": "string",
  "roles": ["string"],
  "permissions": ["string"],
  "isActive": "boolean",
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)",
  "lastLogin": "string (date-time)"
}
```

### Role

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "permissions": ["string"],
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)"
}
```

### Permission

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "category": "string"
}
```

### UserSession

```json
{
  "id": "string",
  "userId": "string",
  "deviceInfo": {
    "deviceId": "string",
    "deviceType": "string",
    "browser": "string",
    "operatingSystem": "string",
    "ipAddress": "string",
    "userAgent": "string"
  },
  "createdAt": "string (date-time)",
  "lastActivityAt": "string (date-time)",
  "expiresAt": "string (date-time)"
}
```

### AuditLog

```json
{
  "id": "string",
  "eventType": "string",
  "userId": "string",
  "username": "string",
  "action": "string",
  "status": "string",
  "ipAddress": "string",
  "userAgent": "string",
  "details": "object",
  "timestamp": "string (date-time)"
}
```

### AuthEvent

```json
{
  "type": "USER_CREATED | USER_UPDATED | USER_CHANGED | USER_DEACTIVATED | LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT | ROLE_ASSIGNED | ROLE_REMOVED",
  "timestamp": "string (date-time)",
  "userId": "string",
  "username": "string",
  "details": "object"
}
```

### DeviceInfo

```json
{
  "deviceId": "string",
  "deviceType": "string",
  "browser": "string",
  "operatingSystem": "string",
  "ipAddress": "string",
  "userAgent": "string"
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
