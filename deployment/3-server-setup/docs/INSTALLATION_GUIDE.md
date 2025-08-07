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

## Step 2: Prepare Deployment Package

### 2.1 Build Docker Images (On Development Machine)

Before deploying to production servers, you need to build all Docker images:

```bash
# Navigate to CollectionCRM project root
cd /path/to/CollectionCRM

# Build all Docker images
./deployment/builder/build-all.sh

# This will create images in deployment/package/docker-images/
# The build process will:
# - Build all application services (frontend, api-gateway, auth-service, etc.)
# - Pull all required infrastructure images (PostgreSQL, Redis, Nginx, etc.)
# - Generate manifest.json and checksums
```

### 2.2 Create Deployment Package

```bash
# Create the deployment package with Docker images
cd /path/to/CollectionCRM

# Create tar.gz with deployment files
tar -czf collectioncrm-3-server-setup.tar.gz deployment/3-server-setup/

# Create tar file with Docker images (this will be large, ~2-3GB)
cd deployment/package/docker-images
tar -cf ../../../docker-images.tar *.tar.gz manifest.json checksums.sha256
cd ../../../
```

### 2.3 Copy Package to Servers

Copy both the deployment package and Docker images to all three servers:

```bash
# Copy to Server 1 (Database)
scp collectioncrm-3-server-setup.tar.gz user@<SERVER1_IP>:/opt/collectioncrm/
scp docker-images.tar user@<SERVER1_IP>:/opt/collectioncrm/

# Copy to Server 2 (Cache)
scp collectioncrm-3-server-setup.tar.gz user@<SERVER2_IP>:/opt/collectioncrm/
scp docker-images.tar user@<SERVER2_IP>:/opt/collectioncrm/

# Copy to Server 3 (Application)
scp collectioncrm-3-server-setup.tar.gz user@<SERVER3_IP>:/opt/collectioncrm/
scp docker-images.tar user@<SERVER3_IP>:/opt/collectioncrm/
```

> **Note**: If you have limited bandwidth, you can copy images only to the servers that need them:
> - Server 1: Only database-related images
> - Server 2: Only cache/message queue images  
> - Server 3: All application and nginx images

## Step 3: Deploy CollectionCRM

### 3.1 Extract Package

On **all three servers**, extract the CollectionCRM deployment package:

```bash
cd /opt/collectioncrm

# Extract the deployment package (contents go directly to /opt/collectioncrm/)
tar -xzf collectioncrm-3-server-setup.tar.gz --strip-components=2

# Extract Docker images to the docker-images directory
mkdir -p docker-images
cd docker-images
tar -xf ../docker-images.tar
cd ..

# Make scripts executable
chmod +x scripts/*.sh
```

### 3.2 Configure Network

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

## Step 4.5: Generate Test Data (Optional)

This step is optional and should only be performed if you want to populate the database with test data for development, testing, or performance evaluation purposes. **Do not run this on production systems with real data.**

The test data generation script will create realistic test data including customers, loans, and related entities in the bank_sync_service schema, which is used by the Bank Sync Service.

### 4.5.1 Prepare Test Data Generation

On **Server 1** (Database Server):

```bash
# Navigate to the deployment directory
cd /opt/collectioncrm

# Load the deployment configuration to get database credentials
source deployment.conf

# Copy the test data generation scripts into the PostgreSQL container
docker cp scripts/gen-test-data collectioncrm-postgres:/tmp/
```

### 4.5.2 Execute Test Data Generation Script

Run the test data generation script inside the PostgreSQL container with the appropriate database credentials:

```bash
# Execute the test data generation script inside the PostgreSQL container
docker exec -it collectioncrm-postgres bash -c "
cd /tmp/gen-test-data &&
chmod +x *.sql &&
DB_HOST=localhost DB_PORT=5432 DB_NAME=${POSTGRES_DB} DB_USER=${POSTGRES_USER} DB_PASSWORD=${POSTGRES_PASSWORD} ./run-performance-test-data-generation.sh
"
```

The script will:

1. Check prerequisites (psql availability, database connection, disk space)
2. Check if staging_bank schema already exists and prompt to regenerate if needed
3. Prompt you to select a data generation scale:
   - **small**: 1,000 customers, 3,000 loans (< 1 minute)
   - **medium**: 10,000 customers, 30,000 loans (1-5 minutes)
   - **large**: 100,000 customers, 300,000 loans (5-15 minutes)
   - **xlarge**: 1,000,000 customers, 3,000,000 loans (30-60 minutes)
4. Generate test data in the staging_bank schema
5. Ask for confirmation before loading data to the bank_sync_service schema

> **Note**: The script is interactive and will require user input at several points. Make sure to monitor the process and respond to prompts as needed.

### 4.5.3 Example Output

```
[2023-08-07 04:40:01] Starting CollectionCRM Performance Test Data Generation
[2023-08-07 04:40:01] Database: collectioncrm @ localhost:5432
[2023-08-07 04:40:01] Checking prerequisites...
[2023-08-07 04:40:01] Testing database connection...
[2023-08-07 04:40:01] Disk space check passed. Available: 120GB
[2023-08-07 04:40:01] Checking existing staging_bank schema...
[2023-08-07 04:40:01] Select data generation scale:
[2023-08-07 04:40:01]   1) small   - 1K customers, 3K loans (< 1 minute)
[2023-08-07 04:40:01]   2) medium  - 10K customers, 30K loans (1-5 minutes)
[2023-08-07 04:40:01]   3) large   - 100K customers, 300K loans (5-15 minutes)
[2023-08-07 04:40:01]   4) xlarge  - 1M customers, 3M loans (30-60 minutes)
Enter your choice (1-4) [default: 1]: 2
[2023-08-07 04:40:05] Selected scale: medium
[2023-08-07 04:40:05] Starting MEDIUM scale test data generation...
[2023-08-07 04:40:05] Generating:
[2023-08-07 04:40:05]   - 10,000 customers
[2023-08-07 04:40:05]   - 30,000 loans
[2023-08-07 04:40:05]   - 10,000 reference customers
[2023-08-07 04:42:30] Successfully completed: Test data generation
[2023-08-07 04:42:30] Data generation completed in 2 minutes and 25 seconds
[2023-08-07 04:42:30] WARNING: The next step will TRUNCATE all data in bank_sync_service schema!
Do you want to load test data into bank_sync_service schema? (y/N): y
[2023-08-07 04:42:35] Loading data from staging_bank to bank_sync_service...
[2023-08-07 04:43:10] Successfully completed: Loading test data
[2023-08-07 04:43:10] Data loading completed in 0 minutes and 35 seconds
[2023-08-07 04:43:10] Fetching final row counts...
       table_full_name        | formatted_count
-----------------------------+------------------
 bank_sync_service.customers |         10,000
 bank_sync_service.loans     |         30,000
 bank_sync_service.reference_customers |         10,000
 bank_sync_service.collaterals |         15,000
 bank_sync_service.phones    |         25,000
 bank_sync_service.addresses |         20,000
 bank_sync_service.emails    |         18,000
 bank_sync_service.due_segmentations |         30,000
 bank_sync_service.loan_collaterals |         12,000
 bank_sync_service.loan_custom_fields |         40,000
[2023-08-07 04:43:10] Performance test data has been successfully loaded!
[2023-08-07 04:43:10] You can now run performance tests against the bank_sync_service schema.
```

### 4.5.4 Verify Test Data

After the script completes, you can verify that the test data was created successfully:

```bash
# Check row counts in the bank_sync_service schema
docker exec -it collectioncrm-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
SELECT table_name, COUNT(*) as row_count
FROM information_schema.tables
WHERE table_schema = 'bank_sync_service'
GROUP BY table_name
ORDER BY table_name;"
```

### 4.5.5 Clean Up Test Data (Optional)

If you need to remove the test data later:

```bash
# Truncate test data from the bank_sync_service schema (keeps schema structure)
docker exec -it collectioncrm-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'bank_sync_service' LOOP
        EXECUTE 'TRUNCATE TABLE bank_sync_service.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END \$\$;

# Drop the staging_bank schema (used only for test data generation)
DROP SCHEMA IF EXISTS staging_bank CASCADE;"

# Remove the test data scripts from the container
docker exec collectioncrm-postgres rm -rf /tmp/gen-test-data
```

> **Important Notes**:
> - Generating test data, especially at large or xlarge scales, will consume significant disk space and may impact database performance. Ensure you have adequate resources before proceeding.
> - This process will truncate any existing data in the bank_sync_service schema. Do not run this on production systems with real data.
> - The script is interactive and requires user input. Make sure to monitor the process and respond to prompts as needed.

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