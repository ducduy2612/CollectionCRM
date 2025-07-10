# CollectionCRM 3-Server Installation Guide

This guide provides detailed step-by-step instructions for deploying CollectionCRM across 3 servers for production use.

## Overview

CollectionCRM is deployed using a 3-server architecture for optimal performance and cost-effectiveness:

- **Server 1**: Database Server (PostgreSQL + PgBouncer + Backup)
- **Server 2**: Cache/Message Server (Redis + Kafka + Zookeeper)
- **Server 3**: Application Server (All microservices + Nginx + Frontend)

This setup supports:
- 1-10M loans
- 500-2000 concurrent collection agents
- Cost: ~$600-1200/month

## Prerequisites

### Server Requirements

**Server 1 - Database Server**
- CPU: 4 cores
- RAM: 8GB (16GB recommended)
- Storage: 250GB SSD
- OS: Ubuntu 20.04+ or CentOS 8+

**Server 2 - Cache/Message Server**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- OS: Ubuntu 20.04+ or CentOS 8+

**Server 3 - Application/Load Balancer Server**
- CPU: 8 cores
- RAM: 16GB
- Storage: 100GB SSD
- OS: Ubuntu 20.04+ or CentOS 8+

### Software Requirements

All servers must have:
- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- Root or sudo access
- Internet connection (for initial setup)

### Network Requirements

- All servers must be able to communicate with each other
- Server 3 must be accessible from the internet (ports 80/443)
- Firewall configured to allow required ports

## Step 1: Prepare Servers

### 1.1 Install Docker and Docker Compose

Run on **all three servers**:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 1.2 Configure Firewall

**Server 1 (Database):**
```bash
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 5432/tcp        # PostgreSQL
sudo ufw allow 6432/tcp        # PgBouncer
sudo ufw --force enable
```

**Server 2 (Cache/Message):**
```bash
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 6379/tcp        # Redis
sudo ufw allow 2181/tcp        # Zookeeper
sudo ufw allow 9092/tcp        # Kafka
sudo ufw --force enable
```

**Server 3 (Application):**
```bash
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 80/tcp          # HTTP
sudo ufw allow 443/tcp         # HTTPS
sudo ufw allow 9000/tcp        # MinIO (optional)
sudo ufw --force enable
```

### 1.3 Create Directory Structure

Run on **all three servers**:

```bash
# Create deployment directory
sudo mkdir -p /opt/collectioncrm
sudo chown $USER:$USER /opt/collectioncrm
cd /opt/collectioncrm

# Create data directories
sudo mkdir -p /var/lib/collectioncrm
sudo chown -R $USER:$USER /var/lib/collectioncrm
```

## Step 2: Deploy CollectionCRM Package

### 2.1 Extract Package

On **all three servers**, extract the CollectionCRM deployment package:

```bash
cd /opt/collectioncrm

# Extract the deployment package
tar -xzf collectioncrm-3-server-setup.tar.gz

# Make scripts executable
chmod +x scripts/*.sh
```

### 2.2 Configure Network

Run on **all three servers** (same command):

```bash
cd /opt/collectioncrm
sudo ./scripts/setup-network.sh
```

This creates a shared Docker network for inter-server communication.

## Step 3: Generate and Distribute Configuration

### 3.1 Generate Master Configuration (Server 1)

On **Server 1** only:

```bash
cd /opt/collectioncrm

# Generate master configuration with passwords
sudo ./scripts/install.sh server1

# The script will:
# - Generate secure passwords
# - Save them to deployment.conf
# - Load Docker images (if available)
# - Start PostgreSQL, PgBouncer, and backup services
# - Create database schemas
```

### 3.2 Copy Configuration to Other Servers

After Server 1 installation completes, **securely copy** the configuration to other servers:

```bash
# From Server 1, copy configuration to Server 2
scp /opt/collectioncrm/deployment.conf user@server2:/opt/collectioncrm/

# From Server 1, copy configuration to Server 3
scp /opt/collectioncrm/deployment.conf user@server3:/opt/collectioncrm/
```

**⚠️ SECURITY NOTE:** 
- Use secure methods to transfer the configuration file (SCP, SFTP, or encrypted USB)
- Ensure proper file permissions: `chmod 600 deployment.conf`
- Never send passwords via email or insecure channels
- Consider using a password manager or vault for enterprise deployments
- Delete temporary copies of the configuration file after use

**Alternative Secure Methods:**
```bash
# Method 1: Manual password entry
# Edit deployment.conf on each server and manually enter the same passwords

# Method 2: Use environment variables
export POSTGRES_PASSWORD="your_secure_password"
export REDIS_PASSWORD="your_secure_password"
export JWT_SECRET="your_secure_jwt_secret"

# Method 3: Use encrypted file transfer
gpg --symmetric deployment.conf  # Encrypt
scp deployment.conf.gpg user@server2:/opt/collectioncrm/
# Then decrypt on target server
```

### 3.3 Deploy Database Server (Server 1)

The database server is already deployed from step 3.1.

**Expected output:**
```
======================================
CollectionCRM 3-Server Installation
======================================

Installation mode: server1
✓ All requirements met
✓ Configuration loaded
✓ All passwords generated and saved to configuration
✓ Directories created
✓ Network 'collectioncrm-network' exists
✓ server1 installation completed
✓ Installation verification PASSED

======================================
Installation completed successfully!
======================================
```

### 3.4 Deploy Cache/Message Server (Server 2)

On **Server 2** only (after copying configuration):

```bash
cd /opt/collectioncrm

# Secure the configuration file
sudo chmod 600 deployment.conf

# Run installation script
sudo ./scripts/install.sh server2

# The script will:
# - Use passwords from deployment.conf
# - Load Docker images (if available)
# - Start Redis, Kafka, and Zookeeper services
```

**Expected output:**
```
======================================
CollectionCRM 3-Server Installation
======================================

Installation mode: server2
✓ All requirements met
✓ Network 'collectioncrm-network' exists
✓ server2 installation completed
✓ Installation verification PASSED

======================================
Installation completed successfully!
======================================
```

### 3.5 Deploy Application Server (Server 3)

On **Server 3** only (after copying configuration):

```bash
cd /opt/collectioncrm

# Secure the configuration file
sudo chmod 600 deployment.conf

# Run installation script
sudo ./scripts/install.sh server3

# The script will:
# - Use passwords from deployment.conf
# - Load Docker images (if available)
# - Start all microservices, frontend, and Nginx
# - Configure reverse proxy
```

**Expected output:**
```
======================================
CollectionCRM 3-Server Installation
======================================

Installation mode: server3
✓ All requirements met
✓ Network 'collectioncrm-network' exists
✓ server3 installation completed
✓ Installation verification PASSED

======================================
Installation completed successfully!
======================================

You can access CollectionCRM at:
  http://[SERVER-3-IP]
  http://localhost (if on local machine)
```

## Step 4: Verify Installation

### 4.1 Check Service Status

On each server, verify services are running:

```bash
# Check running containers
docker ps

# Check logs for any errors
docker-compose logs -f
```

### 4.2 Run Verification Script

On **each server**:

```bash
cd /opt/collectioncrm
./scripts/verify-install.sh
```

### 4.3 Test Connectivity

From **Server 3**, test connectivity to other servers:

```bash
# Test database connection
docker exec collectioncrm-api-gateway ping -c 3 172.20.1.10

# Test Redis connection
redis-cli -h 172.20.2.10 -p 6379 -a [REDIS_PASSWORD] ping

# Test Kafka connection
docker exec collectioncrm-api-gateway nc -zv 172.20.2.12 9092
```

### 4.4 Access Application

Open your web browser and navigate to:
- `http://[SERVER-3-IP]`

You should see the CollectionCRM login page.

## Step 5: Initial Configuration

### 5.1 Access Admin Panel

Default admin credentials:
- Username: `admin@collectioncrm.com`
- Password: `admin123` (change immediately after first login)

### 5.2 Change Default Passwords

1. Log in as admin
2. Go to Settings > User Management
3. Change the admin password
4. Create additional user accounts as needed

### 5.3 Configure Bank Integration

1. Go to Settings > Bank Integration
2. Configure your bank API credentials
3. Set up synchronization schedules

### 5.4 Set Up Collection Workflows

1. Go to Workflow > Templates
2. Create collection workflow templates
3. Define escalation rules and timelines

## Step 6: SSL Certificate Setup (Recommended)

### 6.1 Install Certbot

On **Server 3**:

```bash
sudo apt install certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate

```bash
# Stop nginx container temporarily
docker stop collectioncrm-nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/collectioncrm/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/collectioncrm/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/chain.pem /opt/collectioncrm/nginx/ssl/

# Update nginx configuration to use SSL version
cp nginx/nginx.conf nginx/nginx-active.conf
```

### 6.3 Update Docker Compose

Edit `docker-compose.server3-application.yml`:

```yaml
nginx:
  volumes:
    - ./nginx/nginx-active.conf:/etc/nginx/nginx.conf:ro  # Use SSL config
```

### 6.4 Restart Services

```bash
docker-compose -f docker-compose.server3-application.yml up -d
```

## Maintenance Tasks

### Daily Backups

Database backups are automatically created daily. To manually create a backup:

```bash
# On Server 1
docker exec collectioncrm-postgres-backup /backup.sh
```

### Update Application

To update CollectionCRM:

1. Download new deployment package
2. Stop services: `docker-compose down`
3. Extract new package
4. Start services: `docker-compose up -d`

### Monitor Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker logs collectioncrm-api-gateway -f
```

### Scale Services

To handle increased load, you can scale individual services:

```bash
# Scale API Gateway
docker-compose up -d --scale api-gateway=2

# Scale Auth Service
docker-compose up -d --scale auth-service=2
```

## Troubleshooting

### Common Issues

**1. Services not starting**
```bash
# Check logs
docker-compose logs [service-name]

# Check disk space
df -h

# Check memory usage
free -m
```

**2. Network connectivity issues**
```bash
# Verify network exists
docker network ls | grep collectioncrm

# Recreate network if needed
./scripts/setup-network.sh
```

**3. Database connection errors**
```bash
# Check PostgreSQL status
docker exec collectioncrm-postgres pg_isready

# Check PgBouncer status
docker exec collectioncrm-pgbouncer psql -h localhost -p 6432 -U collectioncrm -c "SHOW POOLS;"
```

**4. High memory usage**
```bash
# Check container resource usage
docker stats

# Adjust memory limits in docker-compose.yml if needed
```

### Performance Tuning

**Database Optimization:**
- Adjust PostgreSQL configuration in `docker-compose.server1-database.yml`
- Monitor query performance
- Add indexes for frequently queried columns

**Redis Optimization:**
- Adjust maxmemory settings
- Configure appropriate eviction policy
- Monitor memory usage

**Application Optimization:**
- Scale microservices based on load
- Adjust resource limits
- Enable application-level caching

## Support

### Log Files

Important log files:
- Installation: `/opt/collectioncrm/installation.log`
- Verification: `/opt/collectioncrm/verification.log`
- Application: `docker logs [container-name]`

### Configuration Files

Key configuration files:
- `/opt/collectioncrm/deployment.conf` - Main configuration
- `/opt/collectioncrm/.env` - Environment variables
- `/opt/collectioncrm/nginx/nginx.conf` - Nginx configuration

### Getting Help

1. Check the troubleshooting section above
2. Review application logs for specific error messages
3. Verify all services are running with `docker ps`
4. Run the verification script: `./scripts/verify-install.sh`

For additional support, contact your CollectionCRM administrator with:
- Server specifications
- Error messages from logs
- Output from verification script
- Network configuration details