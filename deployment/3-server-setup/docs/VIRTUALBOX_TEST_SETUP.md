# VirtualBox 3-Server Test Environment Setup

This guide helps you set up a 3-server CollectionCRM test environment using VirtualBox to validate the deployment before production.

## Prerequisites

- VirtualBox 6.1+ installed
- At least 16GB RAM on host machine
- At least 100GB free disk space
- Ubuntu 22.04 LTS ISO downloaded

## VirtualBox Setup

### Step 1: Create Virtual Machines

#### VM 1 - Database Server (server1-db)

1. **Create New VM:**
   - Name: `collectioncrm-server1-db`
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: 4096 MB
   - Hard disk: 50 GB (dynamically allocated)

2. **Configure VM Settings:**
   - CPU: 2 cores
   - Network: 
     - Adapter 1: NAT (for internet access)
     - Adapter 2: Internal Network (name: `collectioncrm-internal`)
   - Enable VT-x/AMD-V

#### VM 2 - Cache Server (server2-cache)

1. **Create New VM:**
   - Name: `collectioncrm-server2-cache`
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: 4096 MB
   - Hard disk: 30 GB (dynamically allocated)

2. **Configure VM Settings:**
   - CPU: 2 cores
   - Network:
     - Adapter 1: NAT
     - Adapter 2: Internal Network (name: `collectioncrm-internal`)

#### VM 3 - Application Server (server3-app)

1. **Create New VM:**
   - Name: `collectioncrm-server3-app`
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: 6144 MB
   - Hard disk: 40 GB (dynamically allocated)

2. **Configure VM Settings:**
   - CPU: 4 cores
   - Network:
     - Adapter 1: NAT
     - Adapter 2: Internal Network (name: `collectioncrm-internal`)
     - Port Forwarding (NAT): Host Port 8080 → Guest Port 80

### Step 2: Install Ubuntu on All VMs

For each VM:

1. **Boot from Ubuntu ISO**
2. **Install Ubuntu Server:**
   - Username: `vboxuser`
   - Password: `1234` (for testing only)
   - Install OpenSSH server
   - No additional packages needed

3. **Post-installation setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install useful tools
sudo apt install -y curl wget net-tools

# Configure static IP for internal network
sudo nano /etc/netplan/01-netcfg.yaml
```

### Step 3: Configure Network

#### Server 1 (Database) - IP: 192.168.100.10

```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      addresses:
        - 192.168.100.10/24
      nameservers:
        addresses:
          - 8.8.8.8
```

#### Server 2 (Cache) - IP: 192.168.100.20

```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      addresses:
        - 192.168.100.20/24
      nameservers:
        addresses:
          - 8.8.8.8
```

#### Server 3 (Application) - IP: 192.168.100.30

```yaml
# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      addresses:
        - 192.168.100.30/24
      nameservers:
        addresses:
          - 8.8.8.8
```

Apply network configuration on all servers:
```bash
sudo netplan apply
```

### Step 4: Install Docker on All VMs

Run on **all three VMs**:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
```

### Step 5: Setup SSH Keys (Optional)

For easier management, set up SSH keys:

```bash
# On your host machine, generate SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/collectioncrm_test

# Copy to each VM
ssh-copy-id -i ~/.ssh/collectioncrm_test.pub collectioncrm@192.168.100.10
ssh-copy-id -i ~/.ssh/collectioncrm_test.pub collectioncrm@192.168.100.20
ssh-copy-id -i ~/.ssh/collectioncrm_test.pub collectioncrm@192.168.100.30
```

## Deployment Testing

### Step 1: Prepare Deployment Package

On your host machine:

```bash
# Create deployment package
cd /home/code/CollectionCRM
tar -czf collectioncrm-3-server-setup.tar.gz deployment/3-server-setup/

# Copy to each VM
scp collectioncrm-3-server-setup.tar.gz collectioncrm@192.168.100.10:/home/collectioncrm/
scp collectioncrm-3-server-setup.tar.gz collectioncrm@192.168.100.20:/home/collectioncrm/
scp collectioncrm-3-server-setup.tar.gz collectioncrm@192.168.100.30:/home/collectioncrm/
```

### Step 2: Extract and Setup on All VMs

On **each VM**:

```bash
# Create directory
sudo mkdir -p /opt/collectioncrm
sudo chown vboxuser:vboxuser /opt/collectioncrm

# Extract package
cd /opt/collectioncrm
tar -xzf /home/collectioncrm/collectioncrm-3-server-setup.tar.gz --strip-components=2

# Make scripts executable
chmod +x scripts/*.sh

# Create data directories
sudo mkdir -p /var/lib/collectioncrm
sudo chown -R vboxuser:vboxuser /var/lib/collectioncrm
```

### Step 3: Use VirtualBox-Specific Compose Files

**Important:** The deployment package includes VirtualBox-specific Docker Compose files that are pre-configured for VM-to-VM networking. These files use the `vbox-` prefix and are ready to use without modification.

#### VirtualBox Compose Files:
- `docker-compose.vbox-server1-database.yml` - Database server (uses standard Docker networking)
- `docker-compose.vbox-server2-cache.yml` - Cache server (exposes ports to other VMs)
- `docker-compose.vbox-server3-application.yml` - Application server (connects to VM IPs)

#### Key Differences from Production Files:
- **No external Docker networks** - Uses standard bridge networking within each VM
- **VM IP addresses** - Services connect using VirtualBox internal network IPs (192.168.100.x)
- **Exposed ports** - Database and cache services expose ports to other VMs
- **Reduced resource limits** - Optimized for VirtualBox testing environment
- **HTTP-only Nginx** - Uses nginx-no-ssl.conf for easier testing

**Note:** No manual editing required - the VirtualBox compose files are ready to use.

### Step 4: Deploy Services

#### Step 4.1: Generate Configuration on Server 1

First, generate the master configuration on the database server:

```bash
ssh collectioncrm@192.168.100.10
cd /opt/collectioncrm

# Generate configuration and deploy database server
sudo ./scripts/vbox-setup.sh server1
```

#### Step 4.2: Copy Configuration to Other Servers

```bash
# Copy configuration from Server 1 to Server 2
scp collectioncrm@192.168.100.10:/opt/collectioncrm/deployment.conf /tmp/
scp /tmp/deployment.conf collectioncrm@192.168.100.20:/opt/collectioncrm/

# Copy configuration from Server 1 to Server 3  
scp collectioncrm@192.168.100.10:/opt/collectioncrm/deployment.conf /tmp/
scp /tmp/deployment.conf collectioncrm@192.168.100.30:/opt/collectioncrm/

# Clean up temporary file
rm /tmp/deployment.conf
```

#### Step 4.3: Deploy Cache Server (Server 2)

```bash
ssh collectioncrm@192.168.100.20
cd /opt/collectioncrm

# Secure the configuration file
sudo chmod 600 deployment.conf

# Deploy cache/message server
sudo ./scripts/vbox-setup.sh server2
```

#### Step 4.4: Deploy Application Server (Server 3)

```bash
ssh collectioncrm@192.168.100.30
cd /opt/collectioncrm

# Secure the configuration file
sudo chmod 600 deployment.conf

# Deploy application server
sudo ./scripts/vbox-setup.sh server3
```

**What the VirtualBox setup script does:**
- ✅ Generates secure passwords and configuration
- ✅ Creates required directories
- ✅ Loads Docker images (if available)
- ✅ Creates environment files
- ✅ Uses VirtualBox-specific compose files
- ❌ **Skips** Docker external network setup (not needed for VirtualBox)

**Manual Configuration Alternative:**

If you prefer to generate configuration manually:

```bash
# On Server 1, generate configuration only
sudo ./scripts/vbox-setup.sh config-only

# Then copy to other servers and deploy
sudo ./scripts/vbox-setup.sh server1  # On Server 1
sudo ./scripts/vbox-setup.sh server2  # On Server 2  
sudo ./scripts/vbox-setup.sh server3  # On Server 3
```

### Step 5: Test the Deployment

#### Verify Services:
```bash
# On each server, check running containers
docker ps

# Run verification script
./scripts/verify-install.sh
```

#### Test Application Access:
```bash
# From host machine, access the application
# Open browser to: http://localhost:8080
```

#### Test Inter-Server Communication:
```bash
# From Server 3, test connectivity
ping 192.168.100.10  # Database server
ping 192.168.100.20  # Cache server

# Test service ports
nc -zv 192.168.100.10 5432  # PostgreSQL
nc -zv 192.168.100.20 6379  # Redis
```

## Monitoring and Debugging

### View Logs:
```bash
# On any server
docker-compose logs -f

# Specific service
docker logs collectioncrm-postgres -f
```

### Resource Monitoring:
```bash
# Check resource usage
docker stats

# System resources
htop
df -h
free -m
```

### Network Debugging:
```bash
# Check network connectivity
docker network ls
docker network inspect collectioncrm-network

# Test service health
curl http://192.168.100.30/health
curl http://192.168.100.30/api/health
```

## VM Management Scripts

### Start All VMs:
```bash
#!/bin/bash
# start-test-env.sh
VBoxManage startvm "collectioncrm-server1-db" --type headless
VBoxManage startvm "collectioncrm-server2-cache" --type headless
VBoxManage startvm "collectioncrm-server3-app" --type headless
```

### Stop All VMs:
```bash
#!/bin/bash
# stop-test-env.sh
VBoxManage controlvm "collectioncrm-server1-db" poweroff
VBoxManage controlvm "collectioncrm-server2-cache" poweroff
VBoxManage controlvm "collectioncrm-server3-app" poweroff
```

### VM Snapshots:
```bash
# Create snapshot after successful installation
VBoxManage snapshot "collectioncrm-server1-db" take "after-install"
VBoxManage snapshot "collectioncrm-server2-cache" take "after-install"
VBoxManage snapshot "collectioncrm-server3-app" take "after-install"

# Restore to snapshot if needed
VBoxManage snapshot "collectioncrm-server1-db" restore "after-install"
```

## Cleanup

### Reset Test Environment:
```bash
# Restore from snapshots
./restore-snapshots.sh

# Or completely remove and recreate VMs
VBoxManage unregistervm "collectioncrm-server1-db" --delete
VBoxManage unregistervm "collectioncrm-server2-cache" --delete
VBoxManage unregistervm "collectioncrm-server3-app" --delete
```

## Performance Notes

- **Host Requirements:** 16GB RAM minimum for smooth operation
- **VM Resource Allocation:** Adjust based on your host capabilities
- **Storage:** Use SSD for better performance
- **Network:** Internal network provides good isolation for testing

This setup provides a realistic test environment for validating the 3-server deployment before production deployment.