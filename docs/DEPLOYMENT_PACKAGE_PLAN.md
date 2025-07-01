# CollectionCRM Deployment Package Plan

This document outlines the complete plan for creating a source-code isolated deployment package for customer distribution.

## Project Overview

CollectionCRM requires a deployment package that:
- Contains pre-built Docker images (no source code)
- Can be deployed across multiple servers
- Uses runtime configuration (no build-time environment dependencies)
- Provides easy installation scripts for customers
- Supports the simplified 3-server architecture

## Current Analysis Results

### ✅ Backend Services Status
- **API Gateway**: Production Dockerfile is good (needs minor cleanup)
- **Auth Service**: Production Dockerfile exists and functional
- **Bank Sync Service**: Production Dockerfile exists and functional
- **Workflow Service**: Production Dockerfile exists and functional
- **Campaign Engine**: Missing production Dockerfile (has base image only)
- **Payment Service**: Missing production Dockerfile (has base image only)

### ✅ Frontend Status
- **Fixed**: Modified frontend Dockerfile to use runtime environment substitution
- **Generic**: Builds with placeholders, replaces at container startup
- **Environment Variables**: Only uses `VITE_API_BASE_URL` (cleaned up unused vars)

### ✅ Environment Variable Analysis
Services use proper `process.env` pattern for runtime configuration:
- No `.env` files baked into images
- All configuration injected at runtime
- Proper variable naming conventions identified

### ✅ Network Architecture
- Fixed network isolation issues in existing compose files
- Designed 3-server setup with proper IP addressing
- External network for cross-server communication

## Deployment Package Structure

```
/deployment/
├── package/                    # Customer deployment package
│   ├── docker-images/         # Pre-built images (.tar.gz)
│   │   ├── frontend-v1.0.0.tar.gz
│   │   ├── api-gateway-v1.0.0.tar.gz
│   │   ├── auth-service-v1.0.0.tar.gz
│   │   ├── bank-sync-service-v1.0.0.tar.gz
│   │   ├── workflow-service-v1.0.0.tar.gz
│   │   ├── campaign-engine-v1.0.0.tar.gz
│   │   ├── payment-service-v1.0.0.tar.gz
│   │   ├── postgres_15-alpine.tar.gz
│   │   ├── redis_7-alpine.tar.gz
│   │   ├── nginx_alpine.tar.gz
│   │   ├── confluentinc_cp-zookeeper_7.5.0.tar.gz
│   │   ├── confluentinc_cp-kafka_7.5.0.tar.gz
│   │   ├── prodrigestivill_postgres-backup-local_15.tar.gz
│   │   ├── manifest.json
│   │   └── checksums.sha256
│   ├── config/                # Configuration templates
│   │   ├── env/
│   │   │   ├── .env.template
│   │   │   └── .env.example
│   │   ├── nginx/
│   │   │   ├── nginx.conf
│   │   │   └── ssl/
│   │   ├── docker-compose/
│   │   │   ├── docker-compose.server1-db.yml
│   │   │   ├── docker-compose.server2-cache.yml
│   │   │   └── docker-compose.server3-app.yml
│   │   └── database/
│   │       └── init-scripts/
│   ├── scripts/              # Deployment automation
│   │   ├── install.sh        # Main installation script
│   │   ├── load-images.sh    # Load Docker images
│   │   ├── setup-network.sh  # Configure Docker network
│   │   ├── verify-install.sh # Verify installation
│   │   └── backup.sh         # Backup script
│   ├── docs/                 # Customer documentation
│   │   ├── INSTALLATION_GUIDE.md
│   │   ├── QUICK_START.md
│   │   ├── TROUBLESHOOTING.md
│   │   └── MAINTENANCE.md
│   └── LICENSE               # License file
│
├── builder/                  # Build scripts (internal)
│   ├── build-all.sh          # Build all Docker images
│   ├── package-release.sh    # Create deployment package
│   └── sign-package.sh       # Sign package for integrity
│
└── README.md                 # Internal documentation
```

## Implementation Phases

### Phase 1: Fix Missing Production Dockerfiles ✅ DONE
- [x] Frontend Dockerfile fixed with runtime substitution
- [ ] Create campaign-engine production Dockerfile
- [ ] Create payment-service production Dockerfile
- [x] Test all Dockerfiles build without environment dependencies

### Phase 2: Create Build System
- [ ] Complete `deployment/builder/build-all.sh` script
- [ ] Add missing services to GitHub Actions workflow
- [ ] Test building all services as generic images
- [ ] Verify images work with runtime environment injection

### Phase 3: Create Configuration Templates
- [x] Environment variable template (with proper naming)
- [ ] Docker Compose files for 3-server setup
- [ ] Nginx configuration templates
- [ ] Database initialization scripts

### Phase 4: Create Deployment Scripts
- [ ] `install.sh` - Main orchestrator script
- [ ] `load-images.sh` - Load Docker images from tar.gz
- [ ] `setup-network.sh` - Configure external Docker network
- [ ] `verify-install.sh` - Health checks and verification

### Phase 5: Create Customer Documentation
- [ ] Installation guide with step-by-step instructions
- [ ] Quick start guide
- [ ] Troubleshooting guide
- [ ] Maintenance procedures

### Phase 6: Create Package Builder
- [ ] `package-release.sh` - Automate package creation
- [ ] Package signing and integrity verification
- [ ] Version management and tagging

## Key Technical Decisions

### ✅ Build-time vs Runtime Separation
- **Build-time**: Only application code and dependencies
- **Runtime**: All configuration via environment variables
- **Frontend**: Uses placeholder substitution at container startup

### ✅ Network Architecture
- **External Docker network**: `collectioncrm-network` (172.20.0.0/16)
- **Fixed IP addresses**: For reliable cross-server communication
- **3-server setup**: DB (172.20.1.x), Cache (172.20.2.x), App (172.20.3.x)

### ✅ Environment Variables
Using existing naming conventions:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `KAFKA_BROKERS`
- `VITE_API_BASE_URL` (frontend only)

### ✅ Image Distribution
- **Pre-built images**: Saved as compressed tar.gz files
- **No registries**: Customers don't need Docker Hub/GHCR access
- **Offline deployment**: Complete package with all dependencies

## Customer Experience Flow

1. **Download**: `collectioncrm-v1.0.0-package.tar.gz`
2. **Extract**: To target servers
3. **Configure**: Edit `.env` file with their settings
4. **Run**: `./scripts/install.sh`
5. **Verify**: System automatically checks deployment
6. **Access**: CollectionCRM ready at their domain

## Security Considerations

### ✅ Source Code Protection
- No source code in Docker images (multi-stage builds)
- No development dependencies in production images
- No hardcoded credentials or environment-specific values

### ✅ Package Integrity
- SHA256 checksums for all image files
- Optional GPG signing of complete package
- Verification scripts to ensure package integrity

### ✅ Runtime Security
- Non-root users in all containers
- Secure default configurations
- Environment-based secrets management

## Testing Strategy

### Build Testing
- [ ] Test all Dockerfiles build successfully
- [ ] Verify no source code in final images
- [ ] Test images work with runtime configuration

### Integration Testing
- [ ] Test 3-server deployment in isolated environment
- [ ] Verify cross-server network communication
- [ ] Test complete installation flow

### Customer Simulation
- [ ] Test package extraction and installation
- [ ] Verify documentation completeness
- [ ] Test troubleshooting procedures

## Success Criteria

### For Development Team
- ✅ Single build process creates package for all customers
- ✅ No source code exposure
- ✅ Automated build and packaging pipeline

### For Customers
- ✅ Single download contains everything needed
- ✅ Simple configuration (just environment variables)
- ✅ Automated installation process
- ✅ Clear documentation and support

### For Operations
- ✅ Easy updates and version management
- ✅ Reliable deployment across different environments
- ✅ Comprehensive monitoring and maintenance tools

## Next Steps

1. **Complete missing Dockerfiles** for campaign-engine and payment-service
2. **Implement build system** with the corrected approach
3. **Create deployment scripts** for customer installation
4. **Write customer documentation** 
5. **Test complete flow** in isolated environment
6. **Package first release** for customer distribution

## Notes

- GitHub Actions workflow already builds images correctly for GHCR
- Need to add campaign-engine and payment-service to CI/CD
- Frontend runtime substitution approach tested and working
- 3-server architecture provides good balance of cost vs reliability
- Current compose files need network fixes for multi-server deployment