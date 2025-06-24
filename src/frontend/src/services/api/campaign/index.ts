// Re-export all types
export * from './types';

// Re-export all API modules
export { campaignGroupsApi } from './campaign-groups.api';
export { campaignsApi } from './campaigns.api';
export { customFieldsApi } from './custom-fields.api';
export { configApi } from './config.api';

// Import all APIs to create the combined campaignApi object for backward compatibility
import { campaignGroupsApi } from './campaign-groups.api';
import { campaignsApi } from './campaigns.api';
import { customFieldsApi } from './custom-fields.api';
import { configApi } from './config.api';

// Combined API object that provides all campaign functionality
export const campaignApi = {
  // Campaign Groups API
  ...campaignGroupsApi,
  
  // Campaigns API
  ...campaignsApi,
  
  // Custom Fields API
  ...customFieldsApi,
  
  // Configuration API
  ...configApi
};

// Default export for convenience
export default campaignApi;