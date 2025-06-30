# 4-Server VM Setup Guide for CollectionCRM

This guide walks you through setting up a 4-server production simulation using VirtualBox VMs to practice multi-server deployment.

## System Requirements

- **Host Machine**: 16GB+ RAM, 100GB+ free disk space
- **CPU**: Virtualization support enabled
- **Software**: VirtualBox 6.1+

## Server Architecture

| Server | Role | IP | Resources | Services |
|--------|------|----|-----------|---------| 
| Server 1 | Load Balancer | 192.168.56.10 | 1GB RAM, 1 CPU | Nginx, Frontend, SSL |
| Server 2 | Applications | 192.168.56.20 | 2GB RAM, 2 CPU | All Microservices |
| Server 3 | Database | 192.168.56.30 | 4GB RAM, 4 CPU | PostgreSQL, PgBouncer |
| Server 4 | Cache/Messaging | 192.168.56.40 | 2GB RAM, 2 CPU | Redis, Kafka, Zookeeper |

## Step 1: Install VirtualBox

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install virtualbox virtualbox-ext-pack
```

### macOS (with Homebrew)
```bash
brew install --cask virtualbox
```

### Windows
Download from: https://www.virtualbox.org/

## Step 2: Download Ubuntu Server

Download Ubuntu Server 22.04 LTS ISO from: https://ubuntu.com/download/server

## Step 3: Configure Host-Only Network

1. Open VirtualBox Manager
2. Go to **File → Host Network Manager**
3. Create new network: `vboxnet0`
4. Set IPv4 Address: `192.168.56.1`
5. Set IPv4 Network Mask: `255.255.255.0`
6. **Disable DHCP Server**

## Step 4: Create Virtual Machines

### Server 1 - Load Balancer
1. Click "New" in VirtualBox
2. **Name**: `collectioncrm-lb`
3. **Type**: Linux, **Version**: Ubuntu (64-bit)
4. **Memory**: 1024 MB
5. **Hard disk**: Create VDI, 15 GB
6. **Settings → System → Processor**: 1 CPU
7. **Settings → Network → Adapter 1**: Host-only Adapter (`vboxnet0`)

### Server 2 - App Server
1. **Name**: `collectioncrm-app`
2. **Memory**: 2048 MB
3. **Hard disk**: 25 GB
4. **Processor**: 2 CPUs
5. **Network**: Host-only Adapter (`vboxnet0`)

### Server 3 - Database Server
1. **Name**: `collectioncrm-db`
2. **Memory**: 4096 MB
3. **Hard disk**: 30 GB
4. **Processor**: 4 CPUs
5. **Network**: Host-only Adapter (`vboxnet0`)

### Server 4 - Cache Server
1. **Name**: `collectioncrm-cache`
2. **Memory**: 2048 MB
3. **Hard disk**: 20 GB
4. **Processor**: 2 CPUs
5. **Network**: Host-only Adapter (`vboxnet0`)

## Step 5: Install Ubuntu on Each VM

### Boot Process
1. Start each VM with Ubuntu ISO attached
2. Select "Install Ubuntu Server"
3. Follow standard installation steps

### Network Configuration
Configure static IP for each server:

**Load Balancer (Server 1):**
- IP: `192.168.56.10/24`
- Gateway: `192.168.56.1`
- DNS: `8.8.8.8`

**App Server (Server 2):**
- IP: `192.168.56.20/24`
- Gateway: `192.168.56.1`
- DNS: `8.8.8.8`

**Database Server (Server 3):**
- IP: `192.168.56.30/24`
- Gateway: `192.168.56.1`
- DNS: `8.8.8.8`

**Cache Server (Server 4):**
- IP: `192.168.56.40/24`
- Gateway: `192.168.56.1`
- DNS: `8.8.8.8`

### User Setup
- Create user: `ubuntu`
- Enable OpenSSH server: **Yes**
- No additional packages needed

## Step 6: Post-Installation Setup

Run these commands on **each VM**:

### Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop net-tools
```

### Set Hostnames
```bash
# On Load Balancer (Server 1):
sudo hostnamectl set-hostname collectioncrm-lb

# On App Server (Server 2):
sudo hostnamectl set-hostname collectioncrm-app

# On Database Server (Server 3):
sudo hostnamectl set-hostname collectioncrm-db

# On Cache Server (Server 4):
sudo hostnamectl set-hostname collectioncrm-cache
```

### Install Docker
```bash
# Download and install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Log out and back in to apply group changes
exit
```

### Configure /etc/hosts
Add these entries to `/etc/hosts` on **all VMs**:

```bash
sudo nano /etc/hosts

# Add these lines:
192.168.56.10 collectioncrm-lb lb
192.168.56.20 collectioncrm-app app
192.168.56.30 collectioncrm-db db postgres-primary pgbouncer
192.168.56.40 collectioncrm-cache cache redis kafka zookeeper
```

## Step 7: Transfer Code to VMs

### Option 1: Git Clone (Recommended)
Run on each VM:
```bash
cd /home/ubuntu
git clone <your-repo-url> CollectionCRM
cd CollectionCRM
```

### Option 2: SCP from Host
From your host machine:
```bash
scp -r /path/to/CollectionCRM ubuntu@192.168.56.10:/home/ubuntu/
scp -r /path/to/CollectionCRM ubuntu@192.168.56.20:/home/ubuntu/
scp -r /path/to/CollectionCRM ubuntu@192.168.56.30:/home/ubuntu/
scp -r /path/to/CollectionCRM ubuntu@192.168.56.40:/home/ubuntu/
```

## Step 8: Environment Configuration

### Create Production Environment Files
You'll need to create `.env.production` files for each service. Use your staging environment as a template but update the database and cache connections:

**Database connections should point to:**
- Host: `collectioncrm-db` (192.168.56.30)
- Port: `5432`

**Redis connections should point to:**
- Host: `collectioncrm-cache` (192.168.56.40)
- Port: `6379`

**Kafka connections should point to:**
- Host: `collectioncrm-cache` (192.168.56.40)
- Port: `9092`

## Step 9: Deployment Order

Deploy services in this specific order to handle dependencies:

### 1. Database Server (192.168.56.30)
```bash
ssh ubuntu@192.168.56.30
cd /home/ubuntu/CollectionCRM
docker-compose -f docker/compose/docker-compose.prod-db.yml up -d

# Check status
docker ps
docker logs postgres-primary
```

### 2. Cache Server (192.168.56.40)
```bash
ssh ubuntu@192.168.56.40
cd /home/ubuntu/CollectionCRM
docker-compose -f docker/compose/docker-compose.prod-cache.yml up -d

# Check status
docker ps
docker logs redis
docker logs kafka
```

### 3. App Server (192.168.56.20)
```bash
ssh ubuntu@192.168.56.20
cd /home/ubuntu/CollectionCRM
docker-compose -f docker/compose/docker-compose.prod-app.yml up -d

# Check status
docker ps
docker logs api-gateway
```

### 4. Load Balancer (192.168.56.10)
```bash
ssh ubuntu@192.168.56.10
cd /home/ubuntu/CollectionCRM
docker-compose -f docker/compose/docker-compose.prod-lb.yml up -d

# Check status
docker ps
docker logs nginx-lb
```

## Step 10: Testing and Verification

### Test from Host Machine
```bash
# Test load balancer
curl http://192.168.56.10

# Test direct services
curl http://192.168.56.20:3000/health  # API Gateway
curl http://192.168.56.30:5432         # Database (should timeout - good!)
curl http://192.168.56.40:6379         # Redis (should timeout - good!)
```

### Monitor Resources
Run on each server:
```bash
# System resources
htop

# Docker container stats
docker stats

# Disk usage
df -h

# Service logs
docker logs -f <service-name>
```

## Step 11: Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker logs <container-name>

# Check network connectivity
ping collectioncrm-db
telnet collectioncrm-cache 6379
```

**Memory issues:**
```bash
# Check memory usage
free -h
docker stats

# If out of memory, stop non-essential services
docker-compose down
```

**Network connectivity:**
```bash
# Test inter-server connectivity
ping 192.168.56.30  # Database
ping 192.168.56.40  # Cache

# Check if ports are open
telnet 192.168.56.30 5432
telnet 192.168.56.40 6379
```

## Step 12: Scaling Practice

### Add More App Servers
1. Clone the App Server VM
2. Give it a new IP (192.168.56.21)
3. Update load balancer config to include new server
4. Deploy same app services

### Simulate Failures
- Stop database server: `docker-compose down`
- Stop cache server: Watch app performance degrade
- Stop individual microservices: Test service isolation

## Resource Monitoring Commands

### Database Server
```bash
# PostgreSQL stats
docker exec postgres-primary psql -U $DB_USER -d $DB_NAME -c "SELECT * FROM pg_stat_activity;"

# Database connections
docker exec postgres-primary psql -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM pg_stat_activity;"
```

### Cache Server
```bash
# Redis memory usage
docker exec redis redis-cli info memory

# Kafka topics
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### App Server
```bash
# Service health checks
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Bank Sync
curl http://localhost:3003/health  # Workflow
```

## Security Notes

- This setup is for **development/testing only**
- All services use default passwords
- No firewall or SSL configuration
- Database and cache ports are exposed

For production deployment, implement:
- Strong passwords and secrets management
- Firewall rules
- SSL/TLS certificates
- Regular backups
- Monitoring and alerting

## Next Steps

Once this setup is working:
1. Practice blue-green deployments
2. Test service discovery and load balancing
3. Implement monitoring with Prometheus/Grafana
4. Practice disaster recovery scenarios
5. Learn container orchestration with Docker Swarm or Kubernetes