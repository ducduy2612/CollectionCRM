# Collection Workflow Service

This directory contains the Collection Workflow Service for the Collection CRM system.

## Technology Stack

- Node.js
- TypeScript
- PostgreSQL for data storage
- Kafka for event streaming
- Redis for caching

## Responsibilities

- Managing collection workflows
- Agent management
- Action tracking
- Customer assignment
- Case management

## Features

- Workflow definition and execution
- Agent task assignment and tracking
- Customer case management
- Action recording and history
- Performance metrics tracking
- Workflow reporting
- Integration with call center software

## Structure

- `src/`: Source code
  - `controllers/`: API controllers
  - `models/`: Data models
  - `repositories/`: Data access layer
  - `services/`: Business logic
  - `workflows/`: Workflow definitions
  - `integrations/`: External system integrations
  - `assignments/`: Customer and case assignment logic
  - `metrics/`: Performance metrics calculation
  - `routes/`: API routes
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
- `tests/`: Unit and integration tests