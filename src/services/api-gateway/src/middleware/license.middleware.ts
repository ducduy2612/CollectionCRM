import { Request, Response, NextFunction } from 'express';
import { SecureLicenseValidator } from 'collection-crm-common';
import { logger } from '../utils/logger.utils';

// Initialize validator as singleton
const validator = SecureLicenseValidator.getInstance();

/**
 * Validates license on application startup
 * This should be called once when the API Gateway starts
 */
export async function validateLicenseOnStartup(): Promise<void> {
  const licenseKey = process.env.LICENSE_KEY;

  if (!licenseKey) {
    logger.error('❌ No LICENSE_KEY environment variable found');
    logger.error('Please set LICENSE_KEY in your .env file');
    process.exit(1);
  }

  logger.info('🔐 Validating license...');

  const isValid = validator.validateLicense(licenseKey);

  if (!isValid) {
    logger.error('❌ License validation failed!');
    logger.error('The license key is invalid, expired, or corrupted.');
    logger.error('Please contact support@collectioncrm.com for assistance.');
    process.exit(1);
  }

  const licenseInfo = validator.getLicenseInfo();
  const daysLeft = validator.getDaysUntilExpiry();

  logger.info('✅ License validated successfully');
  logger.info(`📋 Licensed to: ${licenseInfo?.company}`);
  logger.info(`📧 Contact: ${licenseInfo?.email}`);
  logger.info(`📅 Days until expiry: ${daysLeft}`);

  // Warn if expiring soon
  if (daysLeft < 30 && daysLeft > 0) {
    logger.warn(`⚠️  WARNING: License expires in ${daysLeft} days!`);
    logger.warn('⚠️  Please contact sales for renewal: sales@collectioncrm.com');
  } else if (daysLeft <= 0) {
    logger.error('❌ License has expired!');
    process.exit(1);
  }

  // Set up periodic re-validation (every 24 hours)
  setInterval(() => {
    logger.info('🔄 Performing periodic license validation...');
    const stillValid = validator.validateLicense(licenseKey);
    if (!stillValid) {
      logger.error('❌ License validation failed during periodic check');
      process.exit(1);
    }
    logger.info('✅ Periodic license validation successful');
  }, 24 * 60 * 60 * 1000); // 24 hours
}

/**
 * Middleware to add license warnings to response headers
 */
export function licenseWarningMiddleware(req: Request, res: Response, next: NextFunction): void {
  const daysLeft = validator.getDaysUntilExpiry();
  
  if (daysLeft < 30 && daysLeft > 0) {
    res.setHeader('X-License-Warning', `License expires in ${daysLeft} days`);
    res.setHeader('X-License-Renewal', 'Contact sales@collectioncrm.com');
  }

  next();
}

/**
 * Middleware to expose license info (for admin endpoints only)
 */
export function licenseInfoMiddleware(req: Request & { licenseInfo?: any }, res: Response, next: NextFunction): void {
  req.licenseInfo = validator.getLicenseInfo();
  next();
}

/**
 * License status endpoint handler (admin only)
 */
export function getLicenseStatus(req: Request, res: Response): void {
  const licenseInfo = validator.getLicenseInfo();
  const daysLeft = validator.getDaysUntilExpiry();

  if (!licenseInfo) {
    res.status(500).json({
      error: 'License information not available',
    });
    return;
  }

  res.json({
    licensed_to: {
      company: licenseInfo.company,
      email: licenseInfo.email,
    },
    license_id: licenseInfo.id,
    created_at: licenseInfo.createdAt,
    expires_at: licenseInfo.expiresAt,
    days_remaining: daysLeft,
    status: daysLeft > 30 ? 'active' : daysLeft > 0 ? 'expiring_soon' : 'expired',
  });
}