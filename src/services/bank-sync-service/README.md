# Bank Synchronization Service

This directory contains the Bank Synchronization Service for the Collexis system.

## Technology Stack

- Node.js
- TypeScript
- PostgreSQL for data storage
- Kafka for event streaming
- Redis for caching

## Responsibilities

- Synchronizing data with external banking systems
- ETL processes for bank data
- Data normalization and validation
- Providing APIs for bank data access

## Features

- Integration with T24 Core Banking System
- Scheduled data synchronization
- Real-time data updates
- Data transformation and mapping
- Error handling and retry logic
- Audit logging

## Structure

- `src/`: Source code
  - `controllers/`: API controllers
  - `models/`: Data models
  - `repositories/`: Data access layer
  - `services/`: Business logic
  - `integrations/`: External system integrations
  - `etl/`: ETL processes
  - `schedulers/`: Scheduled jobs
  - `routes/`: API routes
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
- `tests/`: Unit and integration tests