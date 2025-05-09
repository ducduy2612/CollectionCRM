# Authentication Service Architecture Diagrams

This document provides visual representations of the Authentication Service architecture, components, and workflows.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Component Diagram](#component-diagram)
3. [Authentication Flow](#authentication-flow)
4. [Token Refresh Flow](#token-refresh-flow)
5. [Role-Based Access Control](#role-based-access-control)
6. [Database Schema](#database-schema)

## High-Level Architecture

The Authentication Service is designed as a standalone microservice that interacts with other services in the CollectionCRM system.

```
                                  ┌─────────────────┐
                                  │                 │
                                  │  API Gateway    │
                                  │                 │
                                  └────────┬────────┘
                                           │
                                           ▼
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│                 │              │                 │              │                 │
│  Frontend       │◄────────────►│  Auth Service   │◄────────────►│  Other Services │
│                 │              │                 │              │                 │
└─────────────────┘              └────────┬────────┘              └─────────────────┘
                                          │
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
                          ▼                               ▼
                  ┌───────────────┐               ┌───────────────┐
                  │               │               │               │
                  │  PostgreSQL   │               │     Redis     │
                  │  Database     │               │  Session Store│
                  │               │               │               │
                  └───────────────┘               └───────────────┘
```

## Component Diagram

The Authentication Service consists of several key components that work together to provide authentication and authorization functionality.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                Auth Service                                 │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐│
│  │             │     │             │     │             │     │             ││
│  │  API Routes ├────►│  Services   ├────►│Repositories ├────►│  Database   ││
│  │             │     │             │     │             │     │             ││
│  └─────────────┘     └──────┬──────┘     └─────────────┘     └─────────────┘│
│                             │                                               │
│                             ▼                                               │
│                      ┌─────────────┐                                        │
│                      │             │                                        │
│                      │   Redis     │                                        │
│                      │Session Store│                                        │
│                      │             │                                        │
│                      └─────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Details

1. **API Routes**:
   - `auth.routes.ts`: Authentication endpoints (login, logout, token refresh)
   - `user.routes.ts`: User management endpoints
   - `role.routes.ts`: Role management endpoints

2. **Services**:
   - `auth.service.ts`: Authentication logic
   - `user.service.ts`: User management logic
   - `role.service.ts`: Role management logic
   - `session-service.ts`: Session management logic

3. **Repositories**:
   - `user.repository.ts`: User data access
   - `role.repository.ts`: Role data access

4. **Database**: PostgreSQL with `auth_service` schema
   - `users` table
   - `roles` table
   - `permissions` table
   - `user_sessions` table

5. **Redis Session Store**: Stores session data and refresh tokens

## Authentication Flow

The following diagram illustrates the authentication flow when a user logs in:

```
┌─────────┐                  ┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
│         │                  │             │                  │             │                  │             │
│ Client  │                  │ Auth Routes │                  │Auth Service │                  │User Service │
│         │                  │             │                  │             │                  │             │
└────┬────┘                  └──────┬──────┘                  └──────┬──────┘                  └──────┬──────┘
     │                              │                               │                                │
     │ POST /login                  │                               │                                │
     │ username, password           │                               │                                │
     │─────────────────────────────►│                               │                                │
     │                              │                               │                                │
     │                              │ login(username, password)     │                                │
     │                              │───────────────────────────────►                                │
     │                              │                               │                                │
     │                              │                               │ validatePassword(password)     │
     │                              │                               │───────────────────────────────►│
     │                              │                               │                                │
     │                              │                               │◄───────────────────────────────│
     │                              │                               │ isValid                        │
     │                              │                               │                                │
     │                              │                               │ createUserSession()            │
     │                              │                               │────────┐                       │
     │                              │                               │        │                       │
     │                              │                               │◄───────┘                       │
     │                              │                               │                                │
     │                              │◄───────────────────────────────                                │
     │                              │ AuthResult                    │                                │
     │                              │                               │                                │
     │◄─────────────────────────────│                               │                                │
     │ JWT token, refresh token     │                               │                                │
     │                              │                               │                                │
┌────┴────┐                  ┌──────┴──────┐                  ┌──────┴──────┐                  ┌──────┴──────┐
│         │                  │             │                  │             │                  │             │
│ Client  │                  │ Auth Routes │                  │Auth Service │                  │User Service │
│         │                  │             │                  │             │                  │             │
└─────────┘                  └─────────────┘                  └─────────────┘                  └─────────────┘
```

## Token Refresh Flow

The following diagram illustrates the token refresh flow when a JWT token expires:

```
┌─────────┐                  ┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
│         │                  │             │                  │             │                  │             │
│ Client  │                  │ Auth Routes │                  │Auth Service │                  │Session Svc  │
│         │                  │             │                  │             │                  │             │
└────┬────┘                  └──────┬──────┘                  └──────┬──────┘                  └──────┬──────┘
     │                              │                               │                                │
     │ POST /token/refresh          │                               │                                │
     │ refreshToken                 │                               │                                │
     │─────────────────────────────►│                               │                                │
     │                              │                               │                                │
     │                              │ refreshToken(refreshToken)    │                                │
     │                              │───────────────────────────────►                                │
     │                              │                               │                                │
     │                              │                               │ refreshToken(refreshToken)     │
     │                              │                               │───────────────────────────────►│
     │                              │                               │                                │
     │                              │                               │ Extract sessionId              │
     │                              │                               │                                │
     │                              │                               │ Get session data               │
     │                              │                               │                                │
     │                              │                               │ Generate new tokens            │
     │                              │                               │                                │
     │                              │                               │ Update session                 │
     │                              │                               │                                │
     │                              │                               │◄───────────────────────────────│
     │                              │                               │ AuthResult                     │
     │                              │                               │                                │
     │                              │◄───────────────────────────────                                │
     │                              │ AuthResult                    │                                │
     │                              │                               │                                │
     │◄─────────────────────────────│                               │                                │
     │ New JWT token, refresh token │                               │                                │
     │                              │                               │                                │
┌────┴────┐                  ┌──────┴──────┐                  ┌──────┴──────┐                  ┌──────┴──────┐
│         │                  │             │                  │             │                  │             │
│ Client  │                  │ Auth Routes │                  │Auth Service │                  │Session Svc  │
│         │                  │             │                  │             │                  │             │
└─────────┘                  └─────────────┘                  └─────────────┘                  └─────────────┘
```

## Role-Based Access Control

The Authentication Service implements a role-based access control (RBAC) system:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                                    User                                       │
│                                                                               │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    │ has
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                                    Role                                       │
│                                                                               │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    │ has
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                                 Permissions                                   │
│                                                                               │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    │ controls access to
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                                 Resources                                     │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Role Hierarchy Example

```
┌─────────────┐
│             │
│    ADMIN    │ ─── All permissions
│             │
└─────────────┘
       ▲
       │
┌─────────────┐
│             │
│ SUPERVISOR  │ ─── Manage agents, view reports
│             │
└─────────────┘
       ▲
       │
┌─────────────┐
│             │
│    AGENT    │ ─── View customers, record actions
│             │
└─────────────┘
```

## Database Schema

The Authentication Service uses the following database schema:

```
┌───────────────────────────┐       ┌───────────────────────────┐
│                           │       │                           │
│          users            │       │          roles            │
│                           │       │                           │
├───────────────────────────┤       ├───────────────────────────┤
│ id (UUID)                 │       │ id (UUID)                 │
│ username (VARCHAR)        │       │ name (VARCHAR)            │
│ email (VARCHAR)           │       │ description (TEXT)        │
│ password_hash (VARCHAR)   │       │ created_at (TIMESTAMP)    │
│ first_name (VARCHAR)      │       │ updated_at (TIMESTAMP)    │
│ last_name (VARCHAR)       │       │                           │
│ role (VARCHAR)            │───────┘                           │
│ is_active (BOOLEAN)       │                                   │
│ created_at (TIMESTAMP)    │                                   │
│ updated_at (TIMESTAMP)    │                                   │
│                           │                                   │
└───────────────┬───────────┘                                   │
                │                                               │
                │                                               │
┌───────────────┴───────────┐       ┌───────────────────────────┐
│                           │       │                           │
│      user_sessions        │       │       permissions         │
│                           │       │                           │
├───────────────────────────┤       ├───────────────────────────┤
│ id (UUID)                 │       │ id (UUID)                 │
│ user_id (UUID)            │───────┤ role_id (UUID)            │
│ token (VARCHAR)           │       │ resource (VARCHAR)        │
│ expires_at (TIMESTAMP)    │       │ action (VARCHAR)          │
│ created_at (TIMESTAMP)    │       │ created_at (TIMESTAMP)    │
│ ip_address (VARCHAR)      │       │ updated_at (TIMESTAMP)    │
│ user_agent (TEXT)         │       │                           │
│                           │       │                           │
└───────────────────────────┘       └───────────────────────────┘
```

### Redis Data Structure

The session data in Redis is organized as follows:

```
auth:session:{sessionId} → {
  userId: "user-uuid",
  username: "john.doe",
  roles: ["AGENT"],
  permissions: ["VIEW_CUSTOMERS", "RECORD_ACTIONS"],
  deviceInfo: {
    userAgent: "Mozilla/5.0...",
    deviceType: "DESKTOP",
    browser: "Chrome",
    os: "Windows",
    ip: "192.168.1.1"
  },
  refreshToken: "base64-encoded-refresh-token",
  expiresAt: "2025-01-15T12:00:00Z",
  createdAt: "2025-01-15T10:00:00Z",
  lastActivityAt: "2025-01-15T11:30:00Z"
}

auth:user:{userId}:sessions → ["session-id-1", "session-id-2", ...]