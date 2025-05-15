# Bank Synchronization Service Deployment Guide

This guide provides detailed instructions for deploying the Bank Synchronization Microservice to various environments, including development, staging, and production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
   - [Docker Deployment](#docker-deployment)
   - [Kubernetes Deployment](#kubernetes-deployment)
   - [Traditional Deployment](#traditional-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [External System Integration](#external-system-integration)
6. [Security Considerations](#security-considerations)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Scaling Strategies](#scaling-strategies)
10. [Deployment Checklist](#deployment-checklist)

## Prerequisites

Before deploying the Bank Synchronization Microservice, ensure you have the following:

- Access to the target environment (development, staging, or production)
- Required credentials for database and external systems
- Docker and Docker Compose (for containerized deployment)
- Kubernetes cluster (for Kubernetes deployment)
- Node.js 18+ and npm 9+ (for traditional deployment)
- PostgreSQL 15+ database
- Redis 7+ instance
- Network access to external banking systems (T24, W4, etc.)

## Deployment Options

### Docker Deployment

The Bank Synchronization Microservice can be deployed using Docker containers, which provides consistency across different environments.

#### Building the Docker Image

1. Navigate to the service directory:

```bash
cd src/services/bank-sync-service
```

2. Build the Docker image:

```bash
docker build -t bank-sync-service:latest .
```

#### Running with Docker Compose

1. Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  bank-sync-service:
    image: bank-sync-service:latest
    container_name: bank-sync-service
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=bank_sync_db
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=your-jwt-secret
      - T24_API_URL=https://t24-api.example.com
      - T24_API_KEY=your-t24-api-key
      - W4_API_URL=https://w4-api.example.com
      - W4_API_KEY=your-w4-api-key
    depends_on:
      - postgres
      - redis
    networks:
      - bank-sync-network

  postgres:
    image: postgres:15
    container_name: bank-sync-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=bank_sync_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - bank-sync-network

  redis:
    image: redis:7
    container_name: bank-sync-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - bank-sync-network

networks:
  bank-sync-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

2. Start the services:

```bash
docker-compose up -d
```

3. Verify the deployment:

```bash
docker-compose ps
```

### Kubernetes Deployment

For production environments, Kubernetes provides better scalability, resilience, and management capabilities.

#### Kubernetes Manifests

1. Create a namespace:

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bank-sync
```

2. Create a ConfigMap for non-sensitive configuration:

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bank-sync-config
  namespace: bank-sync
data:
  NODE_ENV: "production"
  PORT: "3002"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "bank_sync_db"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  LOG_LEVEL: "info"
```

3. Create Secrets for sensitive configuration:

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: bank-sync-secrets
  namespace: bank-sync
type: Opaque
data:
  DB_USER: cG9zdGdyZXM=  # base64 encoded "postgres"
  DB_PASSWORD: cG9zdGdyZXM=  # base64 encoded "postgres"
  JWT_SECRET: eW91ci1qd3Qtc2VjcmV0  # base64 encoded "your-jwt-secret"
  T24_API_KEY: eW91ci10MjQtYXBpLWtleQ==  # base64 encoded "your-t24-api-key"
  W4_API_KEY: eW91ci13NC1hcGkta2V5  # base64 encoded "your-w4-api-key"
```

4. Create a Deployment:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bank-sync-deployment
  namespace: bank-sync
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bank-sync
  template:
    metadata:
      labels:
        app: bank-sync
    spec:
      containers:
      - name: bank-sync
        image: bank-sync-service:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3002
        envFrom:
        - configMapRef:
            name: bank-sync-config
        - secretRef:
            name: bank-sync-secrets
        env:
        - name: T24_API_URL
          value: "https://t24-api.example.com"
        - name: W4_API_URL
          value: "https://w4-api.example.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
```

5. Create a Service:

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: bank-sync-service
  namespace: bank-sync
spec:
  selector:
    app: bank-sync
  ports:
  - port: 80
    targetPort: 3002
  type: ClusterIP
```

6. Apply the manifests:

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

7. Verify the deployment:

```bash
kubectl get pods -n bank-sync
kubectl get services -n bank-sync
```

### Traditional Deployment

For environments where containerization is not an option, you can deploy the service directly on a server.

1. Install Node.js and npm:

```bash
# For Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# For CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

2. Clone the repository:

```bash
git clone https://github.com/your-organization/collectioncrm.git
cd collectioncrm/src/services/bank-sync-service
```

3. Install dependencies:

```bash
npm install --production
```

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Build the application:

```bash
npm run build
```

6. Start the service:

```bash
npm start
```

7. Set up a process manager (PM2):

```bash
npm install -g pm2
pm2 start dist/index.js --name bank-sync-service
pm2 save
pm2 startup
```

## Environment Configuration

The Bank Synchronization Microservice uses environment variables for configuration. Here's a comprehensive list of available configuration options:

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development, staging, production) | development |
| PORT | Server port | 3002 |
| HOST | Server host | 0.0.0.0 |
| API_BASE_PATH | Base path for API endpoints | /api/v1/bank-sync |

### Database Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | PostgreSQL database name | bank_sync_db |
| DB_USER | PostgreSQL username | postgres |
| DB_PASSWORD | PostgreSQL password | postgres |
| DB_POOL_MIN | Minimum pool size | 2 |
| DB_POOL_MAX | Maximum pool size | 10 |
| DB_IDLE_TIMEOUT | Connection idle timeout (ms) | 30000 |

### Redis Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| REDIS_PASSWORD | Redis password | |
| REDIS_DB | Redis database index | 0 |

### Authentication Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| JWT_SECRET | Secret for JWT signing | |
| JWT_EXPIRATION | JWT expiration time | 1h |

### External System Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| T24_API_URL | T24 API URL | |
| T24_API_KEY | T24 API key | |
| W4_API_URL | W4 API URL | |
| W4_API_KEY | W4 API key | |

### Logging Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| LOG_LEVEL | Log level (debug, info, warn, error) | info |
| LOG_FORMAT | Log format (json, pretty) | json |
| LOG_FILE | Log file path (if file logging is enabled) | |

### Synchronization Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| SYNC_BATCH_SIZE | Default batch size for synchronization | 1000 |
| SYNC_CONCURRENCY | Maximum concurrent synchronization operations | 5 |
| SYNC_TIMEOUT | Synchronization operation timeout (ms) | 300000 |

## Database Setup

The Bank Synchronization Microservice requires a PostgreSQL database. Here's how to set it up:

### Creating the Database

1. Connect to PostgreSQL:

```bash
psql -U postgres
```

2. Create the database:

```sql
CREATE DATABASE bank_sync_db;
```

3. Create a dedicated user (optional):

```sql
CREATE USER bank_sync WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE bank_sync_db TO bank_sync;
```

### Running Migrations

1. Set up the database connection in the `.env` file:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bank_sync_db
DB_USER=postgres
DB_PASSWORD=postgres
```

2. Run migrations:

```bash
npm run migrate
```

### Database Maintenance

Regular database maintenance is recommended:

1. Set up regular backups:

```bash
# Add to crontab
0 0 * * * pg_dump -U postgres bank_sync_db > /backups/bank_sync_db_$(date +\%Y\%m\%d).sql
```

2. Set up regular VACUUM operations:

```bash
# Add to crontab
0 2 * * 0 psql -U postgres -d bank_sync_db -c "VACUUM ANALYZE;"
```

## External System Integration

The Bank Synchronization Microservice integrates with external banking systems. Here's how to configure these integrations:

### T24 Core Banking System

1. Obtain API credentials from the T24 system administrator
2. Configure the environment variables:

```
T24_API_URL=https://t24-api.example.com
T24_API_KEY=your-t24-api-key
```

3. Test the connection:

```bash
curl -X GET "https://t24-api.example.com/api/status" \
  -H "Authorization: ApiKey your-t24-api-key"
```

### W4 System

1. Obtain API credentials from the W4 system administrator
2. Configure the environment variables:

```
W4_API_URL=https://w4-api.example.com
W4_API_KEY=your-w4-api-key
```

3. Test the connection:

```bash
curl -X GET "https://w4-api.example.com/api/status" \
  -H "Authorization: ApiKey your-w4-api-key"
```

## Security Considerations

### Network Security

1. Use HTTPS for all API endpoints
2. Implement IP whitelisting for external system connections
3. Use VPN or private network for database connections
4. Configure firewalls to restrict access to necessary ports only

### Authentication and Authorization

1. Use strong JWT secrets
2. Implement short token expiration times
3. Use role-based access control (RBAC)
4. Regularly rotate API keys and credentials

### Data Security

1. Encrypt sensitive data at rest
2. Use TLS for data in transit
3. Implement data masking for sensitive information
4. Regularly audit data access

### Secrets Management

1. Use environment variables for secrets in development
2. Use Kubernetes Secrets or AWS Secrets Manager in production
3. Avoid hardcoding secrets in configuration files
4. Implement secret rotation policies

## Monitoring and Logging

### Prometheus Metrics

The service exposes Prometheus metrics at the `/metrics` endpoint. Configure Prometheus to scrape these metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'bank-sync-service'
    scrape_interval: 15s
    static_configs:
      - targets: ['bank-sync-service:3002']
```

### Grafana Dashboards

Import the provided Grafana dashboards for monitoring:

1. Navigate to Grafana
2. Click "Import Dashboard"
3. Upload the dashboard JSON from `deployment/grafana/dashboards/bank-sync-dashboard.json`

### Log Aggregation

Configure log aggregation using ELK Stack or similar:

1. Install Filebeat on the service nodes
2. Configure Filebeat to collect logs:

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/bank-sync-service/*.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

3. Set up Kibana dashboards for log visualization

## Backup and Recovery

### Database Backups

1. Set up regular database backups:

```bash
# Daily backups
pg_dump -U postgres bank_sync_db > /backups/bank_sync_db_$(date +\%Y\%m\%d).sql

# Keep backups for 30 days
find /backups -name "bank_sync_db_*.sql" -type f -mtime +30 -delete
```

2. Test backup restoration regularly:

```bash
psql -U postgres -d bank_sync_db_test < /backups/bank_sync_db_20250101.sql
```

### Application State Recovery

1. Implement idempotent synchronization operations
2. Store synchronization state in the database
3. Implement recovery procedures for failed synchronization jobs

## Scaling Strategies

### Horizontal Scaling

1. Deploy multiple instances of the service
2. Use a load balancer to distribute traffic
3. Ensure the service is stateless
4. Use Redis for distributed locking and caching

### Vertical Scaling

1. Increase CPU and memory resources
2. Optimize database queries
3. Implement connection pooling
4. Use efficient data structures and algorithms

### Database Scaling

1. Implement read replicas for read-heavy operations
2. Consider database sharding for large datasets
3. Optimize indexes for common queries
4. Implement query caching

## Deployment Checklist

Before deploying to production, ensure you have completed the following checklist:

### Pre-Deployment

- [ ] Run all tests (`npm test`)
- [ ] Build the application (`npm run build`)
- [ ] Verify environment variables
- [ ] Check external system connectivity
- [ ] Review security configurations
- [ ] Prepare database migrations
- [ ] Update API documentation

### Deployment

- [ ] Back up the current database (if applicable)
- [ ] Deploy the new version
- [ ] Run database migrations
- [ ] Verify service health
- [ ] Check logs for errors
- [ ] Monitor performance metrics

### Post-Deployment

- [ ] Verify API endpoints
- [ ] Test synchronization operations
- [ ] Monitor error rates
- [ ] Check resource utilization
- [ ] Update documentation if needed
- [ ] Communicate deployment completion to stakeholders