# CollectionCRM VPS Staging Deployment Guide

This guide will walk you through deploying the CollectionCRM staging environment to your VPS using GitHub Container Registry.

## Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04/22.04 LTS or Debian 11/12
- **RAM**: Minimum 8GB (16GB recommended)
- **CPU**: 4+ cores
- **Storage**: 50GB+ SSD
- **Network**: Public IP with ports 80, 22 open

### Required Software
- Docker Engine 24.0+
- Docker Compose v2.20+
- Git

## Step 1: Initial VPS Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git wget vim htop
```

### 1.2 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
# SSH back in
```

### 1.3 Install Docker Compose
```bash
# Install Docker Compose v2
sudo apt update
sudo apt install -y docker-compose-plugin

# Verify installation
docker compose version
```

## Step 2: Set Up GitHub Container Registry Access

### 2.1 Create GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name like "VPS Docker Access"
4. Select scopes: `read:packages`
5. Generate and save the token

### 2.2 Login to GitHub Container Registry
```bash
# Save your GitHub username
export GITHUB_USERNAME="ducduy2612"

# Login to ghcr.io
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

## Step 3: Clone and Configure Repository

### 3.1 Clone Repository
```bash
sudo mkdir -p /opt
cd /opt
sudo git clone https://github.com/ducduy2612/CollectionCRM.git
sudo chown -R $USER:$USER CollectionCRM
cd CollectionCRM
```

### 3.2 Create Environment Configuration
```bash
# Create .env.staging file from example
cp docker/compose/.env.example docker/compose/.env.staging

# Edit the .env.staging file
vim docker/compose/.env.staging
```

Update the following in `.env.staging`:
```bash
# GitHub Container Registry Configuration
GITHUB_REPOSITORY_OWNER=your-github-username
IMAGE_TAG=staging  # or specific tag like staging-abc123

# Deployment Environment
ENVIRONMENT=staging
```

### 3.3 Create Service Environment Files
```bash
# Create staging environment files for each service
cp src/services/auth-service/.env.example src/services/auth-service/.env.staging
cp src/services/api-gateway/.env.example src/services/api-gateway/.env.staging
cp src/services/bank-sync-service/.env.example src/services/bank-sync-service/.env.staging
cp src/services/workflow-service/.env.example src/services/workflow-service/.env.staging

# Edit each file with appropriate staging values
# Make sure to update:
# - Database credentials
# - Redis password
# - JWT secrets
# - API keys
# - Kafka connection strings
# - frontend env.VITE_API_BASE_URL = domain vps http://103.109.37.62/api
# - Workflow-service env.ALLOWED_ORIGINS = domain vps http://103.109.37.62
```

## Step 4: Nginx Configuration Note

The nginx reverse proxy configuration is already included in the repository at `docker/config/nginx/staging-proxy.conf`. This configuration:
- Routes API requests to the backend services
- Proxies all other requests to the frontend container
- Includes rate limiting and security headers
- No manual configuration needed!

## Step 5: Prepare Database

### 5.1 Create PostgreSQL Configuration
```bash
# Create postgres staging env file
cat > docker/config/postgres.staging.env << 'EOF'
POSTGRES_USER=collectioncrm
POSTGRES_PASSWORD=your_secure_staging_password_here
POSTGRES_DB=collectioncrm_staging
POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
EOF

# Create Redis staging env file
cat > docker/config/redis.staging.env << 'EOF'
REDIS_PASSWORD=your_secure_redis_password_here
EOF
```

### 5.2 Frontend Deployment Note
The frontend is containerized and will be pulled from GitHub Container Registry as a Docker image. No build step is required on the VPS.

## Step 6: Deploy Services

### 6.1 Pull Images from GitHub Container Registry
```bash
# Set environment variables
export GITHUB_REPOSITORY_OWNER=your-github-username
export IMAGE_TAG=staging  # or latest

# Pull all images
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml pull
```

### 6.2 Start Infrastructure Services First
```bash
# Start database and message broker
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml up -d postgres redis zookeeper kafka

# Wait for them to be healthy
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml ps

# Check logs
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml logs postgres
```

### 6.3 Initialize Database
```bash
# Run database migrations
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml exec postgres psql -U collectioncrm -d collectioncrm_staging -c "
CREATE SCHEMA IF NOT EXISTS auth_service;
CREATE SCHEMA IF NOT EXISTS bank_sync_service;
CREATE SCHEMA IF NOT EXISTS workflow_service;
CREATE SCHEMA IF NOT EXISTS payment_service;
"

# If you have migration scripts, run them here
# cd infrastructure/database && npm run migrate:up
```

### 6.4 Start Application Services
```bash
# Start all services
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml up -d

# Check status
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml ps

# Monitor logs
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml logs -f
```

## Step 7: Verify Deployment

### 7.1 Check Service Health
```bash
# Check all services are running
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml ps

# Test API Gateway
curl http://localhost:3000/health

# Test through Nginx
curl http://localhost/api/health
```

### 7.2 Access Applications
- Main Application: http://YOUR_VPS_IP
- Kafka UI: http://YOUR_VPS_IP:8090
- PostgreSQL: YOUR_VPS_IP:5433
- Redis: YOUR_VPS_IP:6380

## Step 8: Set Up Monitoring

### 8.1 Configure Docker Logging
```bash
# Already configured in docker-compose with json-file driver
# Logs are limited to 10MB with 3 rotations
```

### 8.2 System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Set up disk usage alerts
df -h
```

### 8.3 Create Health Check Script
```bash
cat > /opt/CollectionCRM/health-check.sh << 'EOF'
#!/bin/bash
cd /opt/CollectionCRM
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml ps --format "table {{.Name}}\t{{.Status}}"
EOF

chmod +x /opt/CollectionCRM/health-check.sh
```

## Step 9: Configure Backups

### 9.1 Database Backup Script
```bash
cat > /opt/CollectionCRM/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/postgres"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

cd /opt/CollectionCRM
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml exec -T postgres \
  pg_dump -U collectioncrm collectioncrm_staging | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/CollectionCRM/backup-db.sh

# Add to crontab
echo "0 2 * * * /opt/CollectionCRM/backup-db.sh" | crontab -
```


## Step 10: Maintenance Commands

### Common Operations
```bash
# View logs
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml logs -f [service-name]

# Restart a service
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml restart [service-name]

# Update images
export GITHUB_REPOSITORY_OWNER=your-github-username
export IMAGE_TAG=new-tag
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml pull
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml up -d

# Scale a service
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml up -d --scale auth-service=2

# Clean up
docker system prune -a --volumes
```

### Troubleshooting
```bash
# Check service logs
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml logs auth-service

# Access service shell
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml exec auth-service sh

# Check resource usage
docker stats

# Restart everything
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml down
docker compose --env-file docker/compose/.env.staging -f docker/compose/docker-compose.staging.yml up -d
```

## Security Checklist

- [ ] Change all default passwords in env files
- [ ] Configure firewall (ufw or iptables)
- [ ] Set up fail2ban for SSH protection
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Regularly update system packages
- [ ] Monitor logs for suspicious activity
- [ ] Set up alerts for service failures

## Next Steps

1. Access your application at http://YOUR_VPS_IP
2. Set up monitoring alerts
3. Document any custom configurations
4. Create a disaster recovery plan
5. Set up a staging deployment pipeline from GitHub Actions