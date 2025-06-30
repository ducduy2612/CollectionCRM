import crypto from 'crypto';

interface LicenseData {
  id: string;
  company: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  machineId?: string; // Optional hardware binding
}

interface SignedLicense {
  data: LicenseData;
  signature: string;
}

export class SecureLicenseValidator {
  private static instance: SecureLicenseValidator;
  private licenseData: LicenseData | null = null;
  
  // Public key loaded from environment variable
  // NEVER commit the actual key to Git - store in .env file
  private readonly publicKey: string;

  private constructor() {
    // Load public key from environment variable
    this.publicKey = process.env.LICENSE_PUBLIC_KEY || '';
    
    if (!this.publicKey) {
      console.error('WARNING: LICENSE_PUBLIC_KEY not set in environment variables');
      console.error('License validation will fail. Please set LICENSE_PUBLIC_KEY in your .env file');
    }
  }

  static getInstance(): SecureLicenseValidator {
    if (!this.instance) {
      this.instance = new SecureLicenseValidator();
    }
    return this.instance;
  }

  /**
   * Validates a license key by verifying its cryptographic signature
   */
  validateLicense(licenseKey: string): boolean {
    try {
      // Decode the license key
      const decoded = Buffer.from(licenseKey, 'base64').toString('utf-8');
      const signedLicense: SignedLicense = JSON.parse(decoded);

      // Extract data and signature
      const { data, signature } = signedLicense;

      // Verify the signature using the public key
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(JSON.stringify(data));
      verifier.end();

      const isSignatureValid = verifier.verify(
        this.publicKey,
        signature,
        'base64'
      );

      if (!isSignatureValid) {
        console.error('License signature verification failed');
        return false;
      }

      // Check expiration
      const expiryDate = new Date(data.expiresAt);
      const now = new Date();

      if (expiryDate < now) {
        console.error(`License expired on ${expiryDate.toISOString()}`);
        return false;
      }

      // Optional: Check machine binding
      if (data.machineId) {
        const currentMachineId = this.getMachineId();
        if (data.machineId !== currentMachineId) {
          console.error('License is not valid for this machine');
          return false;
        }
      }

      // Store validated license data
      this.licenseData = data;
      
      console.log(`✅ License validated for ${data.company}`);
      console.log(`📧 Registered to: ${data.email}`);
      console.log(`📅 Valid until: ${expiryDate.toLocaleDateString()}`);
      
      return true;

    } catch (error) {
      console.error('License validation error:', error);
      return false;
    }
  }

  /**
   * Gets a unique machine identifier (for hardware binding)
   */
  private getMachineId(): string {
    try {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      
      // Get MAC address of the first non-internal network interface
      for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
          if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
            // Hash the MAC address for privacy
            return crypto.createHash('sha256').update(net.mac).digest('hex');
          }
        }
      }
      
      // Fallback to hostname
      return crypto.createHash('sha256').update(os.hostname()).digest('hex');
    } catch (error) {
      return 'unknown';
    }
  }

  getLicenseInfo(): LicenseData | null {
    return this.licenseData;
  }

  getDaysUntilExpiry(): number {
    if (!this.licenseData) return 0;
    
    const expiryDate = new Date(this.licenseData.expiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }
}

/**
 * IMPORTANT: License generation is handled by a separate, secure script
 * that is NOT committed to Git. See scripts/license-server/ directory.
 * 
 * This file only contains the license VALIDATION logic.
 */

// Express middleware
export const secureLicenseMiddleware = (req: any, res: any, next: any) => {
  const licenseKey = process.env.LICENSE_KEY;
  
  if (!licenseKey) {
    return res.status(403).json({
      error: 'No license key provided',
      message: 'Please set LICENSE_KEY environment variable',
    });
  }

  const validator = SecureLicenseValidator.getInstance();
  
  // Check if we've already validated in this session
  if (!validator.getLicenseInfo()) {
    const isValid = validator.validateLicense(licenseKey);
    
    if (!isValid) {
      return res.status(403).json({
        error: 'Invalid or expired license',
        message: 'Please contact support@collectioncrm.com for assistance',
      });
    }
  }

  // Check if license is expiring soon
  const daysLeft = validator.getDaysUntilExpiry();
  if (daysLeft < 30 && daysLeft > 0) {
    res.setHeader('X-License-Warning', `License expires in ${daysLeft} days`);
  }

  req.licenseInfo = validator.getLicenseInfo();
  next();
};