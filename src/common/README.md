# Common Code Directory

This directory contains shared code and utilities used across multiple services in the Collection CRM system.

## Purpose

The common code provides:
- Consistent implementations of cross-cutting concerns
- Shared data models and types
- Utility functions used by multiple services
- Common middleware and plugins

## Components

### Shared Models

Common data models that are used across multiple services, ensuring consistency in data representation.

### Error Handling

Standardized error handling, including error classes, error codes, and error response formatting.

### Logging

Common logging utilities to ensure consistent log formats and levels across services.

### Validation

Shared validation utilities and schemas for data validation.

### Authentication

Common authentication utilities and middleware.

### Messaging

Shared Kafka producers and consumers, message schemas, and event handling utilities.

### Database

Common database utilities, connection management, and migration tools.

### Testing

Shared testing utilities and fixtures.

## Usage

Services should import these common utilities as needed, rather than reimplementing the same functionality in each service.