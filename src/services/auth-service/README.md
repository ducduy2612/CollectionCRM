# Authentication Service

This directory contains the Authentication Service for the Collection CRM system.

## Technology Stack

- Node.js
- TypeScript
- PostgreSQL for user data storage
- JWT for token handling
- Redis for session management

## Responsibilities

- User management
- Role-based access control
- JWT token handling
- Session management
- Authentication APIs

## Features

- User registration and login
- Password management (reset, change)
- Multi-factor authentication
- Role and permission management
- User profile management
- Session tracking and management

## Structure

- `src/`: Source code
  - `controllers/`: API controllers
  - `models/`: Data models
  - `repositories/`: Data access layer
  - `services/`: Business logic
  - `middleware/`: Express middleware
  - `routes/`: API routes
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
- `tests/`: Unit and integration tests