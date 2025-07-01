# CollectionCRM Simplified Production Deployment Guide

This guide provides a realistic, cost-effective production deployment approach without over-engineering.

## Deployment Options

### Option 1: Single Server (Small-Medium Scale)
- **Suitable for**: < 1M loans, < 500 concurrent agents
- **Cost**: ~$200-400/month
- **Complexity**: Low

### Option 2: 3-Server Setup (Recommended)
- **Suitable for**: 1-10M loans, 500-2000 concurrent agents
- **Cost**: ~$600-1200/month
- **Complexity**: Medium

### Option 3: Docker Swarm Cluster (Large Scale)
- **Suitable for**: 10M+ loans, 2000+ concurrent agents
- **Cost**: $1500+/month
- **Complexity**: High

## Recommended: 3-Server Production Setup

### Server Specifications

**Server 1 - Database Server**
- CPU: 4 cores
- RAM: 8GB (16GB if budget allows)
- Storage: 250GB SSD
- Purpose: PostgreSQL (no replica needed initially)

**Server 2 - Cache/Message Server**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- Purpose: Redis, Kafka (single instance each)

**Server 3 - Application/LB Server**
- CPU: 8 cores
- RAM: 16GB
- Storage: 100GB SSD
- Purpose: All microservices + Nginx

### Why This Setup?
- **No unnecessary replicas**: Redis, Kafka, and PostgreSQL run as single instances
- **Simplified networking**: Use Docker Compose with external networks
- **Easy scaling**: Can add replicas later when needed
- **Cost-effective**: ~$600-800/month on most cloud providers

## Network Architecture (Fixed)

Instead of isolated networks, we'll use a shared external network for inter-server communication:

```
Internet → [Server 3: Nginx + Apps] 
                     ↓
    [Server 2: Redis/Kafka] ← → [Server 1: PostgreSQL]
```

## Step-by-Step Deployment

### Step 1: Create External Network (Run on ALL servers)

```bash
# Create the shared network on each server
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  collectioncrm-network
```

### Step 2: Fix Network Configuration Files

Create fixed compose files with proper networking:

**Fixed `/opt/collectioncrm/docker-compose.prod-db-fixed.yml`** (Server 1):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: collectioncrm-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${DB_USER:-collectioncrm}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME:-collectioncrm}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgres-init:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"  # Expose to other servers
    networks:
      collectioncrm-network:
        ipv4_address: 172.20.1.10
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-collectioncrm}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '3'
          memory: 6G
        reservations:
          cpus: '1'
          memory: 2G

  # Simple backup solution
  postgres-backup:
    image: prodrigestivill/postgres-backup-local:15
    container_name: collectioncrm-postgres-backup
    restart: unless-stopped
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_DB=${DB_NAME:-collectioncrm}
      - POSTGRES_USER=${DB_USER:-collectioncrm}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - SCHEDULE=@daily
      - BACKUP_KEEP_DAYS=7
      - BACKUP_KEEP_WEEKS=4
    volumes:
      - ./backups:/backups
    networks:
      - collectioncrm-network
    depends_on:
      - postgres

volumes:
  postgres-data:
    driver: local

networks:
  collectioncrm-network:
    external: true
```

**Fixed `/opt/collectioncrm/docker-compose.prod-cache-fixed.yml`** (Server 2):

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: collectioncrm-redis
    restart: unless-stopped
    command: >
      redis-server
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"  # Expose to other servers
    networks:
      collectioncrm-network:
        ipv4_address: 172.20.2.10
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 3G

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: collectioncrm-zookeeper
    restart: unless-stopped
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181
      - ZOOKEEPER_TICK_TIME=2000
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
      - zookeeper-logs:/var/lib/zookeeper/log
    networks:
      collectioncrm-network:
        ipv4_address: 172.20.2.11
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: collectioncrm-kafka
    restart: unless-stopped
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
      - KAFKA_LISTENERS=INTERNAL://0.0.0.0:9092,EXTERNAL://0.0.0.0:19092
      - KAFKA_ADVERTISED_LISTENERS=INTERNAL://172.20.2.12:9092,EXTERNAL://172.20.2.12:19092
      - KAFKA_INTER_BROKER_LISTENER_NAME=INTERNAL
      - KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
      - KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1
      - KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1
      - KAFKA_AUTO_CREATE_TOPICS_ENABLE=true
      - KAFKA_LOG_RETENTION_HOURS=72
    volumes:
      - kafka-data:/var/lib/kafka/data
    ports:
      - "9092:9092"
      - "19092:19092"
    networks:
      collectioncrm-network:
        ipv4_address: 172.20.2.12
    depends_on:
      - zookeeper
    healthcheck:
      test: ["CMD-SHELL", "kafka-broker-api-versions --bootstrap-server localhost:9092"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 2G

volumes:
  redis-data:
    driver: local
  zookeeper-data:
    driver: local
  zookeeper-logs:
    driver: local
  kafka-data:
    driver: local

networks:
  collectioncrm-network:
    external: true
```

**Fixed `/opt/collectioncrm/docker-compose.prod-app-fixed.yml`** (Server 3):

```yaml
version: '3.8'

services:
  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    container_name: collectioncrm-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - collectioncrm-network
    depends_on:
      - api-gateway
      - frontend
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # Frontend
  frontend:
    build:
      context: ../../
      dockerfile: docker/production-images/frontend.Dockerfile
    image: collectioncrm/frontend:${VERSION:-latest}
    container_name: collectioncrm-frontend
    restart: unless-stopped
    networks:
      - collectioncrm-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # API Gateway
  api-gateway:
    build:
      context: ../../
      dockerfile: docker/production-images/api-gateway.Dockerfile
    image: collectioncrm/api-gateway:${VERSION:-latest}
    container_name: collectioncrm-api-gateway
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=172.20.1.10
      - DB_PORT=5432
      - DB_USER=${DB_USER:-collectioncrm}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME:-collectioncrm}
      - REDIS_HOST=172.20.2.10
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - KAFKA_BROKERS=172.20.2.12:9092
    networks:
      - collectioncrm-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # Auth Service
  auth-service:
    build:
      context: ../../
      dockerfile: docker/production-images/auth-service.Dockerfile
    image: collectioncrm/auth-service:${VERSION:-latest}
    container_name: collectioncrm-auth-service
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_HOST=172.20.1.10
      - DB_PORT=5432
      - DB_USER=${DB_USER:-collectioncrm}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME:-collectioncrm}
      - REDIS_HOST=172.20.2.10
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - collectioncrm-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 384M

  # Bank Sync Service
  bank-sync-service:
    build:
      context: ../../
      dockerfile: docker/production-images/bank-sync-service.Dockerfile
    image: collectioncrm/bank-sync-service:${VERSION:-latest}
    container_name: collectioncrm-bank-sync-service
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DB_HOST=172.20.1.10
      - DB_PORT=5432
      - DB_USER=${DB_USER:-collectioncrm}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME:-collectioncrm}
      - REDIS_HOST=172.20.2.10
      - KAFKA_BROKERS=172.20.2.12:9092
    networks:
      - collectioncrm-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 384M

  # Workflow Service
  workflow-service:
    build:
      context: ../../
      dockerfile: docker/production-images/workflow-service.Dockerfile
    image: collectioncrm/workflow-service:${VERSION:-latest}
    container_name: collectioncrm-workflow-service
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3003
      - DB_HOST=172.20.1.10
      - DB_PORT=5432
      - DB_USER=${DB_USER:-collectioncrm}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME:-collectioncrm}
      - REDIS_HOST=172.20.2.10
      - KAFKA_BROKERS=172.20.2.12:9092
    networks:
      - collectioncrm-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # Campaign Engine
  campaign-engine:
    image: collectioncrm/campaign-engine:${VERSION:-latest}
    container_name: collectioncrm-campaign-engine
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3004
      - DB_HOST=172.20.1.10
      - DB_PORT=5432
      - DB_USER=${DB_USER:-collectioncrm}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME:-collectioncrm}
      - REDIS_HOST=172.20.2.10
      - KAFKA_BROKERS=172.20.2.12:9092
    networks:
      - collectioncrm-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # Payment Service
  payment-service:
    image: collectioncrm/payment-service:${VERSION:-latest}
    container_name: collectioncrm-payment-service
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3005
      - DB_HOST=172.20.1.10
      - DB_PORT=5432
      - DB_USER=${DB_USER:-collectioncrm}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME:-collectioncrm}
      - REDIS_HOST=172.20.2.10
      - KAFKA_BROKERS=172.20.2.12:9092
    networks:
      - collectioncrm-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 384M

volumes:
  nginx-cache:
    driver: local

networks:
  collectioncrm-network:
    external: true
```

### Step 3: Environment Configuration

Create `.env` file on each server:

```bash
# Common environment variables
DB_USER=collectioncrm
DB_PASSWORD=your_secure_db_password
DB_NAME=collectioncrm
REDIS_PASSWORD=your_secure_redis_password
JWT_SECRET=your_32_character_jwt_secret
VERSION=latest
```

### Step 4: Deployment Commands

```bash
# On Server 1 (Database)
cd /opt/collectioncrm
docker-compose -f docker-compose.prod-db-fixed.yml up -d

# On Server 2 (Cache/Message)
cd /opt/collectioncrm
docker-compose -f docker-compose.prod-cache-fixed.yml up -d

# On Server 3 (Application/LB)
cd /opt/collectioncrm
docker-compose -f docker-compose.prod-app-fixed.yml up -d
```

### Step 5: Verify Connectivity

Test inter-server communication:

```bash
# From Server 3, test database connection
docker exec collectioncrm-api-gateway ping -c 3 172.20.1.10

# Test Redis connection
docker exec collectioncrm-api-gateway redis-cli -h 172.20.2.10 -a ${REDIS_PASSWORD} ping

# Test Kafka connection
docker exec collectioncrm-api-gateway nc -zv 172.20.2.12 9092
```

## Simplified Nginx Configuration

Create `/opt/collectioncrm/nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api_gateway {
        server api-gateway:3000;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API
        location /api {
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## Simple Monitoring Setup

Add basic monitoring with a single Prometheus/Grafana instance:

```yaml
# monitoring-simple.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - collectioncrm-network

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3100:3000"
    networks:
      - collectioncrm-network

volumes:
  prometheus-data:

networks:
  collectioncrm-network:
    external: true
```

## Backup Strategy (Simple)

Create `/opt/collectioncrm/backup.sh`:

```bash
#!/bin/bash
# Simple daily backup script

BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec collectioncrm-postgres pg_dumpall -U collectioncrm > $BACKUP_DIR/postgres.sql

# Backup Redis
docker exec collectioncrm-redis redis-cli --pass ${REDIS_PASSWORD} BGSAVE
docker cp collectioncrm-redis:/data/dump.rdb $BACKUP_DIR/redis.rdb

# Keep only last 7 days
find /backup -type d -mtime +7 -exec rm -rf {} +
```

Add to crontab:
```bash
0 2 * * * /opt/collectioncrm/backup.sh
```

## Scaling Path

When you need to scale:

1. **Add Database Replica** (at 3M+ loans)
   - Set up PostgreSQL streaming replication
   - Add PgBouncer for connection pooling

2. **Add Redis Sentinel** (at 1000+ concurrent users)
   - Deploy Redis Sentinel for automatic failover
   - Consider Redis Cluster for sharding

3. **Add More App Servers** (at high load)
   - Deploy app services on additional servers
   - Use Docker Swarm or Kubernetes

4. **Add Kafka Replicas** (at high message volume)
   - Deploy Kafka cluster with 3 brokers
   - Increase replication factor

## Cost Comparison

### Current Setup (3 Servers)
- **DigitalOcean**: ~$600/month (3x $200 droplets)
- **AWS EC2**: ~$800/month (3x t3.xlarge)
- **Hetzner**: ~$300/month (3x CX41)

### Overkill Setup (9+ Servers)
- Would cost $2000-4000/month
- Unnecessary complexity for your scale
- Harder to maintain

## Troubleshooting

### Network Issues
```bash
# Check if external network exists on all servers
docker network ls | grep collectioncrm-network

# Recreate if missing
docker network create --driver bridge --subnet=172.20.0.0/16 collectioncrm-network
```

### Service Discovery Issues
```bash
# Services should connect using IP addresses
# If DNS doesn't work, use IPs directly:
# DB: 172.20.1.10
# Redis: 172.20.2.10
# Kafka: 172.20.2.12
```

### Performance Tuning
```bash
# Only if needed, increase container resources
docker update --cpus="2" --memory="1g" collectioncrm-api-gateway
```

## Summary

This simplified setup:
- ✅ Fixes network isolation issues
- ✅ Uses realistic server specs
- ✅ Avoids unnecessary complexity
- ✅ Costs 70% less than the overkill setup
- ✅ Easy to understand and maintain
- ✅ Can handle your expected load
- ✅ Provides clear scaling path

Start with this setup and scale components as needed based on actual usage patterns.