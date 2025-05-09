# Authentication Service API Documentation

This document provides comprehensive documentation for the Authentication Service API endpoints, including request/response examples, authentication requirements, error codes, and rate limiting information.

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Common Response Format](#common-response-format)
4. [Error Codes](#error-codes)
5. [Rate Limiting](#rate-limiting)
6. [API Endpoints](#api-endpoints)
   - [Authentication Operations](#authentication-operations)
   - [User Management Operations](#user-management-operations)
   - [Role Management Operations](#role-management-operations)

## Base URL

```
/api/v1/auth
```

## Authentication

Most endpoints in the Authentication Service API require authentication using JWT tokens. To authenticate requests, include the JWT token in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer <token>
```

The token can be obtained by calling the `/login` endpoint.

## Common Response Format

All responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  },
  "message": "Operation successful",
  "errors": []
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Operation failed",
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Detailed error message",
      "field": "field_name" // Optional, included for validation errors
    }
  ]
}
```

## Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `INVALID_CREDENTIALS` | Invalid username or password | 401 |
| `USER_INACTIVE` | User account is inactive | 401 |
| `AUTHENTICATION_ERROR` | General authentication error | 401 |
| `INVALID_TOKEN` | Token is invalid or expired | 401 |
| `SESSION_NOT_FOUND` | Session not found | 401 |
| `REFRESH_ERROR` | Token refresh failed | 401 |
| `FORBIDDEN` | User does not have permission | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `USER_EXISTS` | Username or email already exists | 409 |
| `ROLE_EXISTS` | Role name already exists | 409 |
| `PASSWORD_CHANGE_FAILED` | Failed to change password | 400 |
| `RESET_REQUEST_ERROR` | Password reset request failed | 500 |
| `SERVER_ERROR` | Internal server error | 500 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |

## Rate Limiting

The Authentication Service implements rate limiting to protect against abuse and ensure service availability. Rate limits are applied on a per-IP basis and vary by endpoint:

| Endpoint | Rate Limit |
|----------|------------|
| `/login` | 10 requests per minute |
| `/token/refresh` | 20 requests per minute |
| `/password/reset` | 5 requests per minute |
| All other endpoints | 60 requests per minute |

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response with the following headers:

- `X-RateLimit-Limit`: The maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: The number of requests remaining in the current time window
- `X-RateLimit-Reset`: The time at which the current rate limit window resets (Unix timestamp)

## API Endpoints

### Authentication Operations

#### Login

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /login`

**Authentication Required:** No

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
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}
```

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid credentials
- `401 Unauthorized`: User account is inactive
- `400 Bad Request`: Validation error
- `429 Too Many Requests`: Rate limit exceeded

#### Logout

Logs out a user and invalidates their session.

**Endpoint:** `POST /logout`

**Authentication Required:** Yes

**Request Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `400 Bad Request`: Token is required
- `500 Internal Server Error`: Logout failed

#### Refresh Token

Refreshes an expired JWT token using a refresh token.

**Endpoint:** `POST /token/refresh`

**Authentication Required:** No

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired refresh token
- `400 Bad Request`: Refresh token is required
- `429 Too Many Requests`: Rate limit exceeded

#### Validate Token

Validates a JWT token and returns user information.

**Endpoint:** `POST /token/validate`

**Authentication Required:** No

**Request Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "USR123456",
      "username": "john.doe",
      "roles": ["AGENT"],
      "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS"]
    }
  },
  "message": "Token is valid",
  "errors": []
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `400 Bad Request`: Token is required

#### Request Password Reset

Requests a password reset for a user.

**Endpoint:** `POST /password/reset`

**Authentication Required:** No

**Request Body:**

```json
{
  "username": "john.doe",
  "email": "john.doe@example.com"
}
```

**Response (200 OK):**

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

**Note:** For security reasons, this endpoint always returns a success response, even if the user does not exist.

**Error Responses:**

- `400 Bad Request`: Validation error
- `429 Too Many Requests`: Rate limit exceeded

#### Change Password

Changes a user's password.

**Endpoint:** `POST /password/change`

**Authentication Required:** Yes

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

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `400 Bad Request`: Validation error
- `400 Bad Request`: Current password is incorrect
- `400 Bad Request`: Password confirmation does not match

### User Management Operations

#### List Users

Retrieves a list of users.

**Endpoint:** `GET /users`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `username` (optional): Filter by username (partial match)
- `email` (optional): Filter by email (partial match)
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Page size (default: 10, max: 100)

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `400 Bad Request`: Invalid query parameters

#### Create User

Creates a new user.

**Endpoint:** `POST /users`

**Authentication Required:** Yes (Admin role)

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

**Response (201 Created):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `400 Bad Request`: Validation error
- `409 Conflict`: Username or email already exists

#### Get User by ID

Retrieves a user by ID.

**Endpoint:** `GET /users/{id}`

**Authentication Required:** Yes (Admin role or own user)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: User ID

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### Update User

Updates an existing user.

**Endpoint:** `PUT /users/{id}`

**Authentication Required:** Yes (Admin role or own user)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: User ID

**Request Body:**

```json
{
  "name": "John Doe Jr.",
  "email": "john.doe.jr@example.com",
  "roles": ["SUPERVISOR"]
}
```

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `400 Bad Request`: Validation error
- `409 Conflict`: Email already exists

#### Activate User

Activates a deactivated user.

**Endpoint:** `PUT /users/{id}/activate`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: User ID

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### Deactivate User

Deactivates an active user.

**Endpoint:** `PUT /users/{id}/deactivate`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: User ID

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### Get User Sessions

Retrieves active sessions for a user.

**Endpoint:** `GET /users/{id}/sessions`

**Authentication Required:** Yes (Admin role or own user)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: User ID

**Response (200 OK):**

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
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### Terminate User Sessions

Terminates all active sessions for a user.

**Endpoint:** `DELETE /users/{id}/sessions`

**Authentication Required:** Yes (Admin role or own user)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: User ID

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

### Role Management Operations

#### List Roles

Retrieves a list of roles.

**Endpoint:** `GET /roles`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

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
      }
    ]
  },
  "message": "Roles retrieved successfully",
  "errors": []
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions

#### Create Role

Creates a new role.

**Endpoint:** `POST /roles`

**Authentication Required:** Yes (Admin role)

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

**Response (201 Created):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `400 Bad Request`: Validation error
- `409 Conflict`: Role name already exists

#### Get Role by ID

Retrieves a role by ID.

**Endpoint:** `GET /roles/{id}`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: Role ID

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Role not found

#### Update Role

Updates an existing role.

**Endpoint:** `PUT /roles/{id}`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: Role ID

**Request Body:**

```json
{
  "description": "Updated collection agent role",
  "permissions": ["VIEW_CUSTOMERS", "RECORD_ACTIONS", "VIEW_REPORTS"]
}
```

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Role not found
- `400 Bad Request`: Validation error

#### Delete Role

Deletes a role.

**Endpoint:** `DELETE /roles/{id}`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: Role ID

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Role not found
- `400 Bad Request`: Role is in use and cannot be deleted

#### Get Users with Role

Retrieves users assigned to a specific role.

**Endpoint:** `GET /roles/{id}/users`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: Role ID

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Page size (default: 10, max: 100)

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Role not found

#### Assign Role to Users

Assigns a role to multiple users.

**Endpoint:** `POST /roles/{id}/users`

**Authentication Required:** Yes (Admin role)

**Request Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

- `id`: Role ID

**Request Body:**

```json
{
  "userIds": ["USR123456", "USR123457"]
}
```

**Response (200 OK):**

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

**Error Responses:**

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Role not found
- `400 Bad Request`: Invalid user IDs