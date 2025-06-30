# Secure License Implementation Workflow

## Overview
This workflow keeps the public key out of Git while maintaining security. The key is stored in environment variables only.

## Setup Process

### 1. Generate RSA Key Pair (One Time Setup)

```bash
# On your secure license server only
openssl genrsa -out private-key.pem 2048
openssl rsa -in private-key.pem -pubout -out public-key.pem

# View the keys
cat private-key.pem  # Keep this SECRET
cat public-key.pem   # This goes to customer .env files
```

### 2. Update Your License Generator

The generator script in `scripts/secure-license-generator.ts` contains the private key. 

**IMPORTANT**: Never commit this script with the real private key!

### 3. For Each Customer Deployment

#### A. Generate License (On Your Secure Server)
```bash
cd /path/to/license-server
ts-node secure-license-generator.ts

# Output:
# - customer-license.lic (send this file to customer)
# - public-key.txt (send this to customer)
# - license-record.json (keep for your records)
```

#### B. Customer Setup
Customer adds to their `.env.production`:
```bash
# License key
LICENSE_KEY=base64encodedlicensehere...

# Public key for verification
LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
```

#### C. Deploy Customer Application
```bash
cd customer-installation
./scripts/deployment/deploy-production.sh
```

## File Structure

### Your License Server (Keep Private)
```
license-server/
├── private-key.pem (NEVER SHARE)
├── secure-license-generator.ts (contains private key)
├── customer-records/
│   ├── company-a-license-record.json
│   └── company-b-license-record.json
└── generated-licenses/
    ├── company-a-license.lic
    └── company-b-license.lic
```

### Customer Gets
```
collectioncrm-deployment/
├── docker-images/
├── docker-compose files...
├── .env.production (they add LICENSE_KEY and LICENSE_PUBLIC_KEY)
└── deploy script
```

### Your Git Repository (Safe to Commit)
```
CollectionCRM/
├── src/common/utils/secure-license.ts (no keys embedded)
├── .env.production.example (template)
├── docs/
└── docker/ (production images)
```

## Security Benefits

✅ **Public key not in Git**: Stored only in customer .env files  
✅ **Private key never distributed**: Stays on your license server  
✅ **Cannot forge licenses**: Need private key to create valid signatures  
✅ **Cannot modify licenses**: Signature breaks if data changes  
✅ **Each customer gets unique keys**: Can revoke individual customers  

## Development vs Production

### Development
```bash
# Use simple license for development
LICENSE_KEY=simple_base64_license_for_dev
# No need for LICENSE_PUBLIC_KEY in dev
```

### Production
```bash
# Use secure license for production
LICENSE_KEY=cryptographically_signed_license
LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
```

## License Distribution Process

1. **Customer purchases license**
2. **You run license generator** → creates:
   - License key (send to customer)
   - Public key (send to customer) 
   - Record (keep for yourself)
3. **Customer adds both to .env.production**
4. **Customer deploys application**
5. **Application validates license on startup**

## Troubleshooting

### "License validation failed"
- Check LICENSE_KEY is set correctly
- Check LICENSE_PUBLIC_KEY is set correctly
- Verify license hasn't expired
- Check for extra spaces/newlines in .env file

### "WARNING: LICENSE_PUBLIC_KEY not set"
- Customer forgot to add public key to .env file
- Check .env.production file exists and is loaded

### License works in dev but not production
- Dev might be using simple license system
- Production requires both LICENSE_KEY and LICENSE_PUBLIC_KEY

## Security Notes

- **Never commit real keys to Git**
- **Store private key in secure location only**
- **Generate new key pairs for different environments**
- **Regularly rotate keys for enhanced security**
- **Monitor license usage and validation attempts**