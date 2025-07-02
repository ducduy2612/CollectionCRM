# Docker Swarm Setup Guide for CollectionCRM Multi-Server Deployment

## Overview
Docker Swarm provides native clustering and orchestration for Docker containers, enabling secure communication between containers across multiple servers.

## Prerequisites
- All 4 servers set up as per 4-SERVER-VM-SETUP.md
- Docker installed on all servers
- Servers can communicate with each other (test with ping)

## Step 1: Initialize Swarm on Manager Node (Load Balancer - 192.168.56.10)

SSH into the Load Balancer server:
```bash
ssh ubuntu@192.168.56.10
```

Initialize Docker Swarm:
```bash
docker swarm init --advertise-addr 192.168.56.10
```

This command will output a join token. Save it! Example output:
```
docker swarm join --token SWMTKN-1-xxxxx-xxxxx 192.168.56.10:2377
```

## Step 2: Join Worker Nodes to Swarm

### On App Server (192.168.56.20):
```bash
ssh ubuntu@192.168.56.20
docker swarm join --token SWMTKN-1-xxxxx-xxxxx 192.168.56.10:2377
```

### On Database Server (192.168.56.30):
```bash
ssh ubuntu@192.168.56.30
docker swarm join --token SWMTKN-1-xxxxx-xxxxx 192.168.56.10:2377
```

### On Cache Server (192.168.56.40):
```bash
ssh ubuntu@192.168.56.40
docker swarm join --token SWMTKN-1-xxxxx-xxxxx 192.168.56.10:2377
```

## Step 3: Verify Swarm Cluster

On the manager node (192.168.56.10):
```bash
docker node ls
```

You should see all 4 nodes listed with STATUS=Ready.

## Step 4: Create Overlay Network

On the manager node, create an overlay network for cross-server communication:
```bash
docker network create \
  --driver overlay \
  --subnet=10.0.0.0/16 \
  --attachable \
  collectioncrm-overlay
```

The `--attachable` flag allows standalone containers to connect to this network.

## Step 5: Update Docker Compose Files

### Update docker-compose.prod-db.yml:
Replace the networks section at the bottom with:
```yaml
networks:
  collectioncrm-db-network:
    driver: bridge
  collectioncrm-overlay:
    external: true
```

Add the overlay network to each service:
```yaml
services:
  postgres-primary:
    # ... existing config ...
    networks:
      - collectioncrm-db-network
      - collectioncrm-overlay
```

### Update docker-compose.prod-app.yml:
Replace the networks section at the bottom with:
```yaml
networks:
  collectioncrm-app-network:
    driver: bridge
  collectioncrm-overlay:
    external: true
```

Update the external network reference:
```yaml
services:
  api-gateway:
    # ... existing config ...
    networks:
      - collectioncrm-app-network
      - collectioncrm-overlay
```

## Step 6: Update Environment Variables

In your .env.production files, update database and cache connections to use service names:

### For App Services (.env.production):
```bash
# Database connection
DB_HOST=postgres-primary
DB_PORT=5432

# Redis connection
REDIS_HOST=redis
REDIS_PORT=6379

# Kafka connection
KAFKA_BROKERS=kafka:9092
```

## Step 7: Deploy Services with Swarm Constraints

### Deploy Database on Database Server:
```bash
# On manager node (192.168.56.10)
docker node update --label-add role=database collectioncrm-db

# Deploy database stack
docker stack deploy -c docker/compose/docker-compose.prod-db.yml db-stack
```

### Deploy Cache on Cache Server:
```bash
# Label the cache node
docker node update --label-add role=cache collectioncrm-cache

# Deploy cache stack
docker stack deploy -c docker/compose/docker-compose.prod-cache.yml cache-stack
```

### Deploy Apps on App Server:
```bash
# Label the app node
docker node update --label-add role=app collectioncrm-app

# Deploy app stack
docker stack deploy -c docker/compose/docker-compose.prod-app.yml app-stack
```

## Step 8: Verify Cross-Server Communication

### Test from App Server:
```bash
# SSH to app server
ssh ubuntu@192.168.56.20

# Test database connectivity
docker exec -it $(docker ps -q -f name=api-gateway) sh
ping postgres-primary
nc -zv postgres-primary 5432

# Test Redis connectivity
ping redis
nc -zv redis 6379
```

## Step 9: Service Discovery

With Docker Swarm, services can discover each other by name across the overlay network:
- `postgres-primary` resolves to the database container IP
- `redis` resolves to the Redis container IP
- `kafka` resolves to the Kafka container IP

## Step 10: Managing the Swarm

### View all services:
```bash
docker service ls
```

### View service logs:
```bash
docker service logs -f <service-name>
```

### Scale a service:
```bash
docker service scale app-stack_api-gateway=3
```

### Update a service:
```bash
docker service update --image collectioncrm/api-gateway:v2 app-stack_api-gateway
```

## Alternative: Using Host Networking (Without Swarm)

If you prefer not to use Swarm, you can configure direct host networking:

### 1. Update docker-compose files to use host IPs:

In `.env.production` files:
```bash
# Use actual server IPs instead of service names
DB_HOST=192.168.56.30
REDIS_HOST=192.168.56.40
KAFKA_BROKERS=192.168.56.40:9092
```

### 2. Bind services to all interfaces:

In docker-compose.prod-db.yml:
```yaml
services:
  postgres-primary:
    ports:
      - "0.0.0.0:5432:5432"  # Bind to all interfaces
```

### 3. Configure firewall rules:

On Database Server:
```bash
# Allow PostgreSQL from app servers
sudo ufw allow from 192.168.56.20 to any port 5432
sudo ufw allow from 192.168.56.10 to any port 5432
```

On Cache Server:
```bash
# Allow Redis and Kafka from app servers
sudo ufw allow from 192.168.56.20 to any port 6379
sudo ufw allow from 192.168.56.20 to any port 9092
```

## Troubleshooting

### Swarm node not connecting:
```bash
# Check swarm status
docker info | grep Swarm

# Leave and rejoin swarm
docker swarm leave --force
docker swarm join --token <token> 192.168.56.10:2377
```

### Network connectivity issues:
```bash
# List networks
docker network ls

# Inspect overlay network
docker network inspect collectioncrm-overlay

# Test DNS resolution
docker run --rm --network collectioncrm-overlay alpine nslookup postgres-primary
```

### Service not starting:
```bash
# Check service status
docker service ps <service-name> --no-trunc

# Check node constraints
docker service inspect <service-name>
```

## Security Considerations

1. **Encrypt overlay network traffic**:
```bash
docker network create \
  --driver overlay \
  --opt encrypted \
  collectioncrm-overlay-secure
```

2. **Restrict Swarm ports**:
- 2377/tcp: Cluster management
- 7946/tcp & 7946/udp: Node communication
- 4789/udp: Overlay network traffic

3. **Use secrets for sensitive data**:
```bash
echo "mypassword" | docker secret create db_password -
docker service create --secret db_password myservice
```

## Next Steps

1. Set up monitoring with Prometheus/Grafana
2. Configure automatic service health checks
3. Implement rolling updates strategy
4. Set up backup and disaster recovery
5. Configure log aggregation with ELK stack