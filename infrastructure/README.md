# Infrastructure Directory

This directory contains configuration and setup for all infrastructure components of the Collection CRM system.

## Structure

- `database/`: PostgreSQL database setup
  - Database schema
  - Initialization scripts
  - Users and permissions configuration
  - Backup and restore procedures
- `search/`: Elasticsearch setup
  - Index structure
  - Mappings and analyzers
  - Kibana configuration
- `messaging/`: Kafka setup
  - Topic structure
  - Zookeeper integration
  - Schema registry
  - Monitoring with Kafdrop/Kafka UI
- `caching/`: Redis setup
  - Caching strategies
  - Data persistence configuration
  - Connection pooling
- `monitoring/`: Monitoring infrastructure
  - Prometheus configuration
  - Grafana dashboards
  - Log aggregation with Fluentd/Fluent Bit
  - Distributed tracing with Jaeger