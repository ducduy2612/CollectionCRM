# Collexis Replacement Project Specification

## Overview

This document serves as the comprehensive specification for the Collexis replacement project. The system is designed to manage collection activities for financial institutions, handling customer data, loan details, collection workflows, and integrations with external systems.

## Table of Contents

1. [System Architecture](system-architecture.md) - System boundaries and component diagram
2. [Data Model](data-model.md) - Data model with entity relationships
3. [Technology Stack](technology-stack.md) - Technology stack recommendations
4. [Microservices](microservices.md) - Microservices structure

## Key Requirements

### 1. Data Management
- Customer data (read-only core data, editable contact info)
- Loan details (read-only)
- Due amounts (read-only)
- Collateral information (read-only)
- Payment tracking (read-only, real-time updates)
- Customer cases record & tracking (editable)
- Action records (editable)

### 2. Workflow Management
- Collection strategies configuration
- Customer assignment
- Activity recording

### 3. Role-Based Access Control
- Collection Agent
- Supervisor
- Administrator

### 4. Integration Requirements
- Daily ETL from T24, W4, and LOS
- Real-time payment updates
- Call center software integration
- GPS tracking mobile app integration

### 5. User Interface
- Web-based interface for office agents

### 6. Non-functional Requirements
- Performance (6M loans, 3M customers)
- Scalability (2000 concurrent users)
- Security, usability, reliability, compliance