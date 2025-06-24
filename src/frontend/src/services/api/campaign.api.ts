// This file provides a unified entry point for campaign API functionality.
// All functionality is available through the campaign directory.

// Re-export everything from the modular campaign API
export * from './campaign/index';

// For backward compatibility, also export the combined campaignApi as default
export { campaignApi as default } from './campaign/index';