// Re-export all types
export * from './types';

// Re-export all API modules
export { actionsApi } from './actions.api';
export { actionConfigApi } from './action-config.api';
export { agentsApi } from './agents.api';
export { statusApi } from './status.api';
export { contactsApi } from './contacts.api';
export { fudAutoConfigApi } from './fud-auto-config.api';

// Import all APIs to create the combined workflowApi object for backward compatibility
import { actionsApi } from './actions.api';
import { actionConfigApi } from './action-config.api';
import { agentsApi } from './agents.api';
import { statusApi } from './status.api';
import { contactsApi } from './contacts.api';
import { fudAutoConfigApi } from './fud-auto-config.api';

// Combined API object that maintains backward compatibility with the original workflowApi
export const workflowApi = {
  // Actions API
  ...actionsApi,
  
  // Action Config API
  ...actionConfigApi,
  
  // Agents API
  ...agentsApi,
  
  // Status API (both dictionary and history functions)
  ...statusApi,
  
  // Contacts API
  ...contactsApi,
  
  // FUD Auto Config API
  ...fudAutoConfigApi
};

// Default export for convenience
export default workflowApi;