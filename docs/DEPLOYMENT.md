# CollectionCRM Deployment Guide

This guide covers staging and production deployment strategies for the CollectionCRM system.

## Overview

CollectionCRM supports three deployment environments:
- **Development**: Single server with hot-reload (existing)
- **Staging**: Single server with production-like configuration
- **Production**: Multi-tier distributed deployment for high availability and scalability

## Architecture Overview

### Staging Environment (Single Server)
```
[Internet] → [Nginx] → [API Gateway] → [Microservices]
                    ↓
            [PostgreSQL] [Redis] [Kafka]
```

### Production Environment (Distributed)
```
[Internet] → [Load Balancer Tier] → [Application Tier] 
                                         ↓
                [Cache/Message Tier] → [Database Tier]
```

## Quick Start

### Staging Deployment
```bash
# Deploy staging environment
./scripts/deployment/deploy-staging.sh v1.0.0

# Check deployment status
docker-compose -f docker/compose/docker-compose.staging.yml ps

# View logs
docker-compose -f docker/compose/docker-compose.staging.yml logs -f
```

### Production Deployment
```bash
# Deploy all tiers
./scripts/deployment/deploy-production.sh v1.0.0

# Deploy specific tier
./scripts/deployment/deploy-production.sh v1.0.0 --tier=app

# Dry run
./scripts/deployment/deploy-production.sh v1.0.0 --dry-run
```

## Environment Configuration

### Staging Environment

#### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 50GB disk space

#### Setup Steps

1. **Create SSL certificates** (self-signed for staging):
```bash
mkdir -p docker/config/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/config/nginx/ssl/staging.key \
  -out docker/config/nginx/ssl/staging.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=staging.collectioncrm.local"
```

2. **Configure environment variables**:
```bash
# Copy and edit staging environment files
cp src/frontend/.env.staging src/frontend/.env.staging.local
cp src/services/api-gateway/.env.staging src/services/api-gateway/.env.staging.local
# Edit files with your actual values
```

3. **Deploy staging**:
```bash
./scripts/deployment/deploy-staging.sh
```

4. **Verify deployment**:
```bash
curl -k https://staging.collectioncrm.local/api/health
```

### Production Environment

#### Infrastructure Requirements

**Minimum Production Setup (3 Servers):**

**Server 1 - Database Tier:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 500GB SSD (database)
- Network: 1Gbps

**Server 2 - Cache/Message Tier:**
- CPU: 4 cores  
- RAM: 8GB
- Storage: 100GB SSD
- Network: 1Gbps

**Server 3 - Application + Load Balancer Tier:**
- CPU: 8 cores
- RAM: 16GB
- Storage: 100GB SSD
- Network: 1Gbps

**Recommended Production Setup (5+ Servers):**
- 1x Database Server (dedicated)
- 1x Cache/Message Server (dedicated)
- 2-3x Application Servers
- 1-2x Load Balancer Servers

#### Production Setup Steps

1. **Server Preparation**:
```bash
# On each server
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose-plugin -y
sudo usermod -aG docker $USER

# Create production marker
sudo mkdir -p /etc/collectioncrm
sudo touch /etc/collectioncrm/production.marker
```

2. **Network Configuration**:
```bash
# Create external network (run once on any server)
docker network create collectioncrm-external
```

3. **Database Tier Deployment** (Server 1):
```bash
./scripts/deployment/deploy-production.sh v1.0.0 --tier=db
```

4. **Cache/Message Tier Deployment** (Server 2):
```bash
./scripts/deployment/deploy-production.sh v1.0.0 --tier=cache
```

5. **Application Tier Deployment** (Server 3):
```bash
./scripts/deployment/deploy-production.sh v1.0.0 --tier=app
```

6. **Load Balancer Tier Deployment** (Server 3 or separate):
```bash
./scripts/deployment/deploy-production.sh v1.0.0 --tier=lb
```

## Service Configuration

### Environment Variables

#### Required Production Variables
```bash
# Database
DB_HOST=10.0.1.10
DB_PASSWORD=secure_production_password
DB_USER=collectioncrm
DB_NAME=collectioncrm_production

# Redis
REDIS_HOST=10.0.1.20
REDIS_PASSWORD=secure_redis_password

# Kafka
KAFKA_BROKERS=10.0.1.20:9092,10.0.1.20:9093,10.0.1.20:9094

# Application
API_BASE_URL=https://collectioncrm.local/api
JWT_SECRET=very_secure_jwt_secret_32_characters_long

# Monitoring
GRAFANA_ADMIN_PASSWORD=secure_grafana_password
```

### SSL/TLS Configuration

#### Production SSL Setup
```bash
# Install Certbot (for Let's Encrypt)
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot certonly --webroot -w /var/www/html -d collectioncrm.local

# Configure automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Database Configuration

#### PostgreSQL Optimization
```sql
-- Production PostgreSQL settings (postgresql.conf)
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.7
wal_buffers = 64MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
max_connections = 500
```

#### Database Backup Strategy
```bash
# Automated backups are configured in docker-compose.prod-db.yml
# Manual backup
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER $DB_NAME < backup_file.sql
```

## Monitoring and Observability

### Prometheus + Grafana Stack

Deploy monitoring stack:
```bash
docker-compose -f docker/compose/docker-compose.monitoring.yml up -d
```

**Access URLs:**
- Grafana: http://server:3001 (admin/admin)
- Prometheus: http://server:9090
- AlertManager: http://server:9093

### Key Metrics to Monitor

**Application Metrics:**
- Request rate and latency
- Error rates (4xx, 5xx)
- Database connection pool usage
- Queue depth (Kafka)

**Infrastructure Metrics:**
- CPU, Memory, Disk usage
- Network I/O
- Docker container health
- Database performance

**Business Metrics:**
- Active collection agents
- Loan processing rate
- Payment success rate
- Customer response rate

### Alerting Rules

Configure alerts for:
- High error rates (>5% over 5 minutes)
- Database connection failures
- High memory usage (>85%)
- Disk space low (<10% free)
- Service unavailability

## Deployment Strategies

### Blue-Green Deployment

For zero-downtime production deployments:

1. **Deploy to staging** (green environment)
2. **Run smoke tests**
3. **Switch traffic** from blue to green
4. **Monitor for issues**
5. **Keep blue as rollback option**

### Rolling Updates

For application tier updates:
```bash
# Update services one by one
docker-compose -f docker-compose.prod-app.yml up -d --no-deps auth-service
# Wait for health check
docker-compose -f docker-compose.prod-app.yml up -d --no-deps api-gateway
```

### Canary Deployment

Route small percentage of traffic to new version:
```nginx
# Nginx configuration for canary
upstream backend_stable {
    server app-server-1:3000 weight=9;
}

upstream backend_canary {
    server app-server-2:3000 weight=1;
}
```

## Backup and Recovery

### Backup Strategy

**Database Backups:**
- Full backup: Daily at 2 AM
- Incremental: Every 6 hours
- Retention: 30 days full, 7 days incremental

**Application Backups:**
- Configuration files
- Environment variables
- Docker images
- SSL certificates

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 1 hour

**Recovery Procedures:**

1. **Database Recovery:**
```bash
# Restore from latest backup
./scripts/deployment/rollback.sh production /path/to/backup
```

2. **Application Recovery:**
```bash
# Redeploy from known good version
./scripts/deployment/deploy-production.sh v1.0.0 --skip-backup
```

## Security Considerations

### Network Security
- Firewall rules between tiers
- Private networks for internal communication
- VPN access for management

### Application Security
- JWT token validation
- Rate limiting
- Input validation
- SQL injection prevention

### Data Security
- Database encryption at rest
- TLS encryption in transit
- Regular security updates
- Access logging

## Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check database connectivity
docker-compose -f docker-compose.prod-db.yml exec postgres-primary pg_isready

# Check connection from application
docker-compose -f docker-compose.prod-app.yml exec api-gateway nc -zv postgres 5432
```

**Service Discovery Issues:**
```bash
# Check Docker networks
docker network ls
docker network inspect collectioncrm-external

# Check service DNS resolution
docker-compose -f docker-compose.prod-app.yml exec api-gateway nslookup auth-service
```

**Performance Issues:**
```bash
# Check resource usage
docker stats

# Check logs for errors
docker-compose logs --tail=100 api-gateway

# Check database performance
docker-compose -f docker-compose.prod-db.yml exec postgres-primary \
  psql -U collectioncrm -c "SELECT * FROM pg_stat_activity;"
```

### Log Analysis

**Centralized Logging:**
```bash
# View aggregated logs
docker-compose -f docker-compose.monitoring.yml logs loki

# Query logs via Grafana
# Use LogQL queries in Grafana Explore
```

**Application Logs:**
```bash
# Follow real-time logs
docker-compose logs -f api-gateway auth-service

# Search for errors
docker-compose logs | grep -i error

# Export logs for analysis
docker-compose logs > deployment_logs_$(date +%Y%m%d).log
```

## Scaling Strategies

### Horizontal Scaling

**Application Tier:**
```bash
# Scale specific service
docker-compose -f docker-compose.prod-app.yml up -d --scale api-gateway=3

# Add new application server
# Deploy docker-compose.prod-app.yml on new server
```

**Database Scaling:**
- Read replicas for read-heavy workloads
- Connection pooling with PgBouncer
- Database partitioning for large tables

### Vertical Scaling

**Resource Limits:**
```yaml
# Increase resource limits in docker-compose files
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 2G
```

## Maintenance Procedures

### Regular Maintenance

**Weekly:**
- Review application logs
- Check disk space usage
- Verify backup integrity
- Security updates

**Monthly:**
- Database maintenance (VACUUM, REINDEX)
- Review performance metrics
- Update dependencies
- Capacity planning review

### Update Procedures

**Application Updates:**
1. Deploy to staging
2. Run integration tests
3. Deploy to production (rolling update)
4. Monitor for issues
5. Document changes

**Infrastructure Updates:**
1. Plan maintenance window
2. Notify stakeholders
3. Update non-production first
4. Test thoroughly
5. Apply to production

## Performance Tuning

### Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM loans WHERE status = 'active';

-- Update table statistics
ANALYZE loans;

-- Rebuild indexes
REINDEX TABLE loans;
```

### Application Optimization
- Connection pooling
- Caching strategies
- Async processing
- Database query optimization

### Infrastructure Optimization
- Container resource limits
- Network optimization
- Storage performance
- Load balancer configuration

## Support and Escalation

### Monitoring Alerts
- **P1 (Critical):** Service down, data loss
- **P2 (High):** Performance degradation
- **P3 (Medium):** Warning thresholds
- **P4 (Low):** Informational

### Contact Information
- **On-call Engineer:** [Your contact info]
- **Database Administrator:** [DBA contact]
- **Infrastructure Team:** [Infra contact]
- **Security Team:** [Security contact]

### Escalation Procedures
1. **P1 Issues:** Immediate escalation
2. **P2 Issues:** Escalate within 30 minutes
3. **P3 Issues:** Escalate within 2 hours
4. **P4 Issues:** Normal business hours

---

For additional support or questions, refer to the project's issue tracker or contact the development team.