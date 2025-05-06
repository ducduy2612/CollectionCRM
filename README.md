# Collection CRM

A comprehensive Collection CRM system built using a containerized microservices architecture.

## Project Overview

This Collection CRM system is designed to manage the entire debt collection process, from bank synchronization to payment processing and collection workflows. The system is built using a containerized approach with Docker, making it easy to deploy and scale.

## Architecture

The system follows a microservices architecture with the following components:

- **Frontend**: React-based web application with TypeScript and Tailwind UI
- **API Gateway**: Entry point for all client requests, handling routing and authentication
- **Microservices**:
  - Authentication Service: User management and authentication
  - Bank Synchronization Service: Integration with banking systems
  - Payment Processing Service: Handling payments and transactions
  - Collection Workflow Service: Managing collection processes and agent workflows
- **Infrastructure**:
  - PostgreSQL: Primary database
  - Elasticsearch: Search engine
  - Kafka: Message broker for event-driven communication
  - Redis: Caching and session management
  - Prometheus & Grafana: Monitoring and alerting

## Directory Structure

- `src/`: Source code
  - `frontend/`: React frontend application
  - `services/`: Microservices
  - `common/`: Shared code and utilities
- `docker/`: Docker-related files
  - `base-images/`: Base Docker images
  - `compose/`: Docker Compose configurations
- `infrastructure/`: Infrastructure components
  - `database/`: PostgreSQL setup
  - `search/`: Elasticsearch setup
  - `messaging/`: Kafka setup
  - `caching/`: Redis setup
  - `monitoring/`: Prometheus and Grafana setup
- `tests/`: Test files
- `deployment/`: Deployment configurations
- `etl/`: ETL processes
- `scripts/`: Utility scripts
- `config/`: Configuration files
- `docs/`: Documentation
- `plan/`: Planning documents
- `mockups/`: UI mockups
- `wireframes/`: UI wireframes

## Getting Started

(To be added: Instructions for setting up the development environment, running the application, and contributing to the project)

## Implementation Roadmap

See [Implementation Roadmap](plan/implementation-roadmap.md) for the detailed project timeline and tasks.

## Documentation

Additional documentation can be found in the `docs/` directory:

- [System Architecture](docs/system-architecture.md)
- [Data Model](docs/data-model.md)
- [Database Schema](docs/database-schema.md)
- [Microservices](docs/microservices.md)
- [Technology Stack](docs/technology-stack.md)
- [User Personas](docs/user-personas.md)
- [User Journeys](docs/user-journeys.md)
- [API Contracts](docs/api-contracts/README.md)