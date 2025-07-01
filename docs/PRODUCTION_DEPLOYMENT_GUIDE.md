# CollectionCRM Production Deployment Guide

This guide provides a comprehensive, step-by-step approach to deploying CollectionCRM in production using Docker Swarm.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Docker Swarm Initialization](#docker-swarm-initialization)
4. [Network Configuration](#network-configuration)
5. [Service Deployment](#service-deployment)
6. [High Availability Setup](#high-availability-setup)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Hardware Requirements (Minimum 9 Servers)

#### Load Balancer Nodes (2 servers)
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- Network: 1Gbps
- Public IP required

#### Application Nodes (3-4 servers)
- CPU: 8 cores
- RAM: 16GB
- Storage: 200GB SSD
- Network: 1Gbps

#### Cache/Message Nodes (2 servers)
- CPU: 8 cores
- RAM: 16GB
- Storage: 200GB SSD (fast NVMe preferred)
- Network: 1Gbps

#### Database Nodes (2 servers)
- CPU: 16 cores
- RAM: 32GB
- Storage: 1TB SSD (NVMe preferred)
- Network: 10Gbps (if available)

### Software Requirements
- Ubuntu 22.04 LTS (all servers)
- Docker Engine 24.0+
- Docker Compose v2.20+
- Git
- OpenSSL

## Infrastructure Setup

### Step 1: Prepare All Servers

Run on **ALL servers**:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    net-tools \
    htop \
    iotop \
    vim

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Configure Docker daemon
sudo tee /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "5"
  },
  "storage-driver": "overlay2",
  "metrics-addr": "0.0.0.0:9323",
  "experimental": true
}
EOF

sudo systemctl restart docker
```

### Step 2: Configure Hostnames and Hosts File

On **ALL servers**, update `/etc/hosts`:

```bash
sudo tee -a /etc/hosts <<EOF
# CollectionCRM Production Cluster
10.0.1.10  lb-01
10.0.1.11  lb-02
10.0.2.10  app-01
10.0.2.11  app-02
10.0.2.12  app-03
10.0.3.10  cache-01
10.0.3.11  cache-02
10.0.4.10  db-01
10.0.4.11  db-02
EOF
```

### Step 3: Configure Firewall

On **ALL servers**:

```bash
# Basic firewall rules
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 2377/tcp  # Docker Swarm management
sudo ufw allow 7946/tcp  # Container network discovery
sudo ufw allow 7946/udp
sudo ufw allow 4789/udp  # Overlay network

# Additional ports per node type
# Load Balancers
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Application nodes - no additional external ports

# Cache nodes
sudo ufw allow 6379/tcp  # Redis (internal only)
sudo ufw allow 9092/tcp  # Kafka (internal only)

# Database nodes  
sudo ufw allow 5432/tcp  # PostgreSQL (internal only)

sudo ufw --force enable
```

## Docker Swarm Initialization

### Step 1: Initialize Swarm Manager

On **app-01** (primary manager):

```bash
# Initialize swarm
docker swarm init --advertise-addr 10.0.2.10

# Save the join tokens
docker swarm join-token manager > ~/manager-token.txt
docker swarm join-token worker > ~/worker-token.txt
```

### Step 2: Join Manager Nodes

On **app-02** and **app-03**:

```bash
# Use the manager token from app-01
docker swarm join --token <MANAGER-TOKEN> 10.0.2.10:2377
```

### Step 3: Join Worker Nodes

On **all other servers** (lb-01, lb-02, cache-01, cache-02, db-01, db-02):

```bash
# Use the worker token from app-01
docker swarm join --token <WORKER-TOKEN> 10.0.2.10:2377
```

### Step 4: Label Nodes

On **app-01**:

```bash
# Label nodes by role
docker node update --label-add role=loadbalancer lb-01
docker node update --label-add role=loadbalancer lb-02
docker node update --label-add role=application app-01
docker node update --label-add role=application app-02
docker node update --label-add role=application app-03
docker node update --label-add role=cache cache-01
docker node update --label-add role=cache cache-02
docker node update --label-add role=database db-01
docker node update --label-add role=database db-02

# Verify
docker node ls
```

## Network Configuration

### Create Overlay Networks

On **app-01**:

```bash
# Create encrypted overlay networks
docker network create \
  --driver overlay \
  --encrypted \
  --attachable \
  --subnet=10.10.0.0/16 \
  collectioncrm-frontend

docker network create \
  --driver overlay \
  --encrypted \
  --attachable \
  --subnet=10.11.0.0/16 \
  collectioncrm-backend

docker network create \
  --driver overlay \
  --encrypted \
  --attachable \
  --subnet=10.12.0.0/16 \
  collectioncrm-data
```

## Service Deployment

### Step 1: Create Docker Stack Files

Create `/opt/collectioncrm/docker-stack-database.yml`:

```yaml
version: '3.8'

services:
  postgres-primary:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - /opt/collectioncrm/database/init:/docker-entrypoint-initdb.d:ro
    networks:
      - collectioncrm-data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.role == database
          - node.hostname == db-01
      resources:
        limits:
          cpus: '8'
          memory: 16G
        reservations:
          cpus: '4'
          memory: 8G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-replica:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_MASTER_SERVICE: postgres-primary
    volumes:
      - postgres-replica-data:/var/lib/postgresql/data
    networks:
      - collectioncrm-data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.role == database
          - node.hostname == db-02
      resources:
        limits:
          cpus: '8'
          memory: 16G
        reservations:
          cpus: '4'
          memory: 8G
    command: |
      bash -c '
        pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U replicator -v -P -W
        echo "standby_mode = on" >> /var/lib/postgresql/data/recovery.conf
        echo "primary_conninfo = 'host=postgres-primary port=5432 user=replicator'" >> /var/lib/postgresql/data/recovery.conf
        postgres
      '

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_HOST: postgres-primary
      DATABASES_PORT: 5432
      DATABASES_USER: ${DB_USER}
      DATABASES_PASSWORD: ${DB_PASSWORD}
      DATABASES_DBNAME: ${DB_NAME}
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 2000
      DEFAULT_POOL_SIZE: 100
    networks:
      - collectioncrm-data
      - collectioncrm-backend
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.role == database
      resources:
        limits:
          cpus: '2'
          memory: 2G

volumes:
  postgres-data:
    driver: local
  postgres-replica-data:
    driver: local

networks:
  collectioncrm-data:
    external: true
  collectioncrm-backend:
    external: true
```

Create `/opt/collectioncrm/docker-stack-cache.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --maxmemory 4gb
      --maxmemory-policy allkeys-lru
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.role == cache
          - node.hostname == cache-01
      resources:
        limits:
          cpus: '4'
          memory: 6G
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  redis-sentinel:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis-sentinel/sentinel.conf
    volumes:
      - /opt/collectioncrm/redis/sentinel.conf:/etc/redis-sentinel/sentinel.conf
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.labels.role == cache
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
      ZOOKEEPER_SERVERS: zookeeper-1:2888:3888;zookeeper-2:2888:3888;zookeeper-3:2888:3888
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
      - zookeeper-logs:/var/lib/zookeeper/log
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.labels.role == cache
      resources:
        limits:
          cpus: '1'
          memory: 1G

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: "{{.Task.Slot}}"
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_LISTENERS: INTERNAL://0.0.0.0:9092,EXTERNAL://0.0.0.0:19092
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka:9092,EXTERNAL://kafka:19092
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 3000
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"
      KAFKA_LOG_RETENTION_HOURS: 168
    volumes:
      - kafka-data:/var/lib/kafka/data
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.labels.role == cache
      resources:
        limits:
          cpus: '2'
          memory: 3G
    healthcheck:
      test: ["CMD-SHELL", "kafka-topics --bootstrap-server localhost:9092 --list"]
      interval: 30s
      timeout: 10s
      retries: 5

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
  collectioncrm-backend:
    external: true
```

Create `/opt/collectioncrm/docker-stack-application.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    image: collectioncrm/api-gateway:${VERSION:-latest}
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: pgbouncer
      REDIS_HOST: redis
      KAFKA_BROKERS: kafka:9092
    networks:
      - collectioncrm-frontend
      - collectioncrm-backend
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.labels.role == application
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      resources:
        limits:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  auth-service:
    image: collectioncrm/auth-service:${VERSION:-latest}
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: pgbouncer
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.role == application
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  bank-sync-service:
    image: collectioncrm/bank-sync-service:${VERSION:-latest}
    environment:
      NODE_ENV: production
      PORT: 3002
      DB_HOST: pgbouncer
      REDIS_HOST: redis
      KAFKA_BROKERS: kafka:9092
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.role == application
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: '1'
          memory: 1G

  workflow-service:
    image: collectioncrm/workflow-service:${VERSION:-latest}
    environment:
      NODE_ENV: production
      PORT: 3003
      DB_HOST: pgbouncer
      REDIS_HOST: redis
      KAFKA_BROKERS: kafka:9092
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.labels.role == application
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: '2'
          memory: 2G

  campaign-engine:
    image: collectioncrm/campaign-engine:${VERSION:-latest}
    environment:
      NODE_ENV: production
      PORT: 3004
      DB_HOST: pgbouncer
      REDIS_HOST: redis
      KAFKA_BROKERS: kafka:9092
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.role == application
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: '2'
          memory: 2G

  payment-service:
    image: collectioncrm/payment-service:${VERSION:-latest}
    environment:
      NODE_ENV: production
      PORT: 3005
      DB_HOST: pgbouncer
      REDIS_HOST: redis
      KAFKA_BROKERS: kafka:9092
    networks:
      - collectioncrm-backend
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.role == application
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: '1'
          memory: 1G

networks:
  collectioncrm-frontend:
    external: true
  collectioncrm-backend:
    external: true
```

Create `/opt/collectioncrm/docker-stack-loadbalancer.yml`:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - target: 80
        published: 80
        mode: host
      - target: 443
        published: 443
        mode: host
    volumes:
      - /opt/collectioncrm/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /opt/collectioncrm/nginx/ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - collectioncrm-frontend
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.role == loadbalancer
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: '2'
          memory: 2G
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: collectioncrm/frontend:${VERSION:-latest}
    networks:
      - collectioncrm-frontend
    deploy:
      replicas: 4
      placement:
        constraints:
          - node.labels.role == loadbalancer
      resources:
        limits:
          cpus: '1'
          memory: 512M

  keepalived:
    image: osixia/keepalived:2.0.20
    cap_add:
      - NET_ADMIN
      - NET_BROADCAST
      - NET_RAW
    environment:
      KEEPALIVED_INTERFACE: eth0
      KEEPALIVED_VIRTUAL_IPS: "#PYTHON2BASH:['10.0.1.100']"
      KEEPALIVED_PRIORITY: "{{.Task.Slot}}"
      KEEPALIVED_UNICAST_PEERS: "#PYTHON2BASH:['10.0.1.10','10.0.1.11']"
    networks:
      - collectioncrm-frontend
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.role == loadbalancer
        preferences:
          - spread: node.hostname

volumes:
  nginx-cache:
    driver: local

networks:
  collectioncrm-frontend:
    external: true
```

### Step 2: Create Configuration Files

Create Nginx configuration `/opt/collectioncrm/nginx/nginx.conf`:

```nginx
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 100;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # Upstream configuration
    upstream api_gateway {
        least_conn;
        server api-gateway:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream frontend {
        least_conn;
        server frontend:80;
        keepalive 16;
    }

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # HTTP server - redirect to HTTPS
    server {
        listen 80;
        server_name collectioncrm.local;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name collectioncrm.local;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache static assets
            location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
                proxy_pass http://frontend;
                expires 30d;
                add_header Cache-Control "public, immutable";
            }
        }

        # API Gateway
        location /api {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
            
            # Timeouts for long-running requests
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth {
            limit_req zone=auth burst=10 nodelay;
            
            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Nginx status for monitoring
        location /nginx_status {
            stub_status on;
            access_log off;
            allow 127.0.0.1;
            allow 10.0.0.0/8;
            deny all;
        }
    }
}
```

Create Redis Sentinel configuration `/opt/collectioncrm/redis/sentinel.conf`:

```conf
port 26379
dir /tmp
sentinel monitor mymaster redis 6379 2
sentinel auth-pass mymaster ${REDIS_PASSWORD}
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
sentinel announce-ip ${SENTINEL_ANNOUNCE_IP}
sentinel announce-port 26379
```

### Step 3: Deploy Services

Deploy in order:

```bash
# 1. Deploy database tier first
docker stack deploy -c /opt/collectioncrm/docker-stack-database.yml collectioncrm-db

# Wait for database to be ready
while ! docker service ls | grep -q "collectioncrm-db_postgres-primary.*1/1"; do
  echo "Waiting for database..."
  sleep 10
done

# 2. Deploy cache tier
docker stack deploy -c /opt/collectioncrm/docker-stack-cache.yml collectioncrm-cache

# Wait for cache services
while ! docker service ls | grep -q "collectioncrm-cache_redis.*1/1"; do
  echo "Waiting for cache..."
  sleep 10
done

# 3. Deploy application tier
docker stack deploy -c /opt/collectioncrm/docker-stack-application.yml collectioncrm-app

# 4. Deploy load balancer tier
docker stack deploy -c /opt/collectioncrm/docker-stack-loadbalancer.yml collectioncrm-lb
```

### Step 4: Initialize Database

```bash
# Run migrations
docker exec $(docker ps -q -f name=collectioncrm-db_postgres-primary) \
  psql -U ${DB_USER} -d ${DB_NAME} -f /docker-entrypoint-initdb.d/01-init-schema.sql

# Create initial admin user
docker exec $(docker ps -q -f name=collectioncrm-app_auth-service) \
  node scripts/create-admin.js
```

## High Availability Setup

### Database HA with Streaming Replication

Configure PostgreSQL streaming replication:

```bash
# On primary (db-01)
docker exec -it $(docker ps -q -f name=postgres-primary) bash

# Configure primary for replication
cat >> /var/lib/postgresql/data/postgresql.conf <<EOF
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
synchronous_commit = on
synchronous_standby_names = 'pgslave001'
EOF

# Create replication user
psql -U postgres -c "CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replication_password';"

# Restart primary
exit
docker service update --force collectioncrm-db_postgres-primary
```

### Redis HA with Sentinel

Redis Sentinel automatically handles failover. Monitor with:

```bash
# Check sentinel status
docker exec $(docker ps -q -f name=redis-sentinel) redis-cli -p 26379 sentinel masters
```

### Kafka HA

Kafka automatically handles broker failures with replication factor of 3.

## Monitoring and Maintenance

### Deploy Monitoring Stack

Create `/opt/collectioncrm/docker-stack-monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
    volumes:
      - /opt/collectioncrm/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring
      - collectioncrm-backend
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.role == application

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana-data:/var/lib/grafana
      - /opt/collectioncrm/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    networks:
      - monitoring
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.role == application

  node-exporter:
    image: prom/node-exporter:latest
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - monitoring
    deploy:
      mode: global

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - "8080:8080"
    networks:
      - monitoring
    deploy:
      mode: global

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: overlay
    attachable: true
  collectioncrm-backend:
    external: true
```

### Backup Strategy

Create automated backup script `/opt/collectioncrm/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backup/collectioncrm"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p ${BACKUP_DIR}/{database,redis,configs}

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec $(docker ps -q -f name=postgres-primary) \
  pg_dumpall -U ${DB_USER} | gzip > ${BACKUP_DIR}/database/postgres_${DATE}.sql.gz

# Backup Redis
echo "Backing up Redis..."
docker exec $(docker ps -q -f name=redis) \
  redis-cli --pass ${REDIS_PASSWORD} BGSAVE

sleep 5

docker cp $(docker ps -q -f name=redis):/data/dump.rdb \
  ${BACKUP_DIR}/redis/redis_${DATE}.rdb

# Backup configurations
echo "Backing up configurations..."
tar -czf ${BACKUP_DIR}/configs/configs_${DATE}.tar.gz /opt/collectioncrm/

# Clean old backups
find ${BACKUP_DIR} -type f -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: ${DATE}"
```

Add to crontab:
```bash
0 2 * * * /opt/collectioncrm/scripts/backup.sh >> /var/log/collectioncrm-backup.log 2>&1
```

## Troubleshooting

### Common Issues

#### 1. Service Discovery Issues
```bash
# Check overlay network
docker network inspect collectioncrm-backend

# Test connectivity between services
docker exec $(docker ps -q -f name=api-gateway) ping redis
```

#### 2. Database Connection Issues
```bash
# Check PgBouncer
docker service logs collectioncrm-app_pgbouncer

# Test direct database connection
docker exec $(docker ps -q -f name=api-gateway) \
  psql -h pgbouncer -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1"
```

#### 3. Performance Issues
```bash
# Check service resource usage
docker stats

# Check specific service
docker service ps collectioncrm-app_api-gateway

# Scale service
docker service scale collectioncrm-app_api-gateway=5
```

#### 4. Rolling Back Updates
```bash
# Rollback a service
docker service rollback collectioncrm-app_api-gateway

# Rollback entire stack
docker stack rm collectioncrm-app
docker stack deploy -c /opt/collectioncrm/docker-stack-application.yml collectioncrm-app
```

### Monitoring Dashboards

Access monitoring tools:
- Grafana: http://your-server:3000 (admin/${GRAFANA_PASSWORD})
- Prometheus: http://your-server:9090
- Node metrics: http://any-server:9100/metrics

### Log Aggregation

View logs across the cluster:
```bash
# All services in a stack
docker stack services collectioncrm-app --format "table {{.Name}}" | \
  tail -n +2 | xargs -I {} docker service logs {}

# Specific service across all replicas
docker service logs -f collectioncrm-app_api-gateway

# With timestamps
docker service logs -t --since 1h collectioncrm-app_api-gateway
```

## Security Hardening

### 1. Enable Docker Content Trust
```bash
export DOCKER_CONTENT_TRUST=1
```

### 2. Use Secrets Management
```bash
# Create secrets
echo "your-db-password" | docker secret create db_password -
echo "your-jwt-secret" | docker secret create jwt_secret -

# Reference in compose files
secrets:
  db_password:
    external: true
```

### 3. Network Policies
```bash
# Restrict network access
iptables -A INPUT -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -j DROP
```

## Performance Tuning

### System Optimization
```bash
# Add to /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
```

### Container Optimization
- Use multi-stage builds to reduce image size
- Enable BuildKit for faster builds
- Use .dockerignore to exclude unnecessary files
- Implement health checks for all services

## Disaster Recovery

### Full System Recovery
1. Restore database from backup
2. Restore Redis data
3. Redeploy all stacks
4. Verify service health
5. Run smoke tests

### Partial Failure Recovery
- Single node failure: Swarm automatically reschedules containers
- Service failure: Health checks trigger automatic restart
- Network partition: Requires manual intervention

## Maintenance Windows

### Rolling Updates (Zero Downtime)
```bash
# Update image
docker service update \
  --image collectioncrm/api-gateway:new-version \
  --update-parallelism 1 \
  --update-delay 30s \
  collectioncrm-app_api-gateway
```

### Blue-Green Deployment
1. Deploy new version to separate stack
2. Test new deployment
3. Switch load balancer to new stack
4. Remove old stack after verification

## Support and Escalation

### Health Check Endpoints
- Overall: https://collectioncrm.local/health
- API Gateway: https://collectioncrm.local/api/health
- Individual services: http://service-name:port/health

### Monitoring Alerts
Configure alerts in Grafana for:
- Service availability < 99%
- Response time > 1s (p95)
- Error rate > 1%
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 80%

### Incident Response
1. Check service health and logs
2. Verify network connectivity
3. Check resource utilization
4. Review recent changes
5. Escalate if needed

---

This production deployment guide provides a robust, scalable architecture suitable for handling your expected load of 6M loans, 3M customers, and 2000 concurrent agents. The Docker Swarm orchestration provides the right balance of functionality and complexity for your scale, with room to grow.