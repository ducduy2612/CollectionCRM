import axios from 'axios';
import logger from '../utils/logger';

const WORKFLOW_SERVICE_API_URL = process.env.WORKFLOW_SERVICE_API_URL || 'http://localhost:3000/workflow-service'; // TODO: Confirm actual URL

export interface CampaignGroup {
  id: string;
  name: string;
  priority: number;
  campaigns: Campaign[];
}

export interface Campaign {
  id: string;
  campaign_group_id: string;
  name: string;
  priority: number;
  base_conditions: BaseCondition[];
  contact_selection_rules: ContactSelectionRule[];
}

export interface BaseCondition {
  id: string;
  campaign_id: string;
  field_name: string;
  operator: string;
  field_value: string;
  data_source: string;
}

export interface ContactSelectionRule {
  id: string;
  campaign_id: string;
  rule_priority: number;
  contact_rule_conditions: ContactRuleCondition[];
  contact_rule_outputs: ContactRuleOutput[];
}

export interface ContactRuleCondition {
  id: string;
  contact_selection_rule_id: string;
  field_name: string;
  operator: string;
  field_value: string;
  data_source: string;
}

export interface ContactRuleOutput {
  id: string;
  contact_selection_rule_id: string;
  related_party_type: string;
  contact_type: string;
}

export interface CustomField {
  id: string;
  field_name: string;
  data_type: string;
  source_mapping: string; // This will need further processing
}

let campaignConfigCache: CampaignGroup[] | null = null;
let customFieldsCache: CustomField[] | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // Cache for 5 minutes

export const fetchCampaignConfig = async (): Promise<CampaignGroup[]> => {
  const now = Date.now();
  if (campaignConfigCache && (now - lastFetchTime) < CACHE_TTL_MS) {
    logger.info('Returning campaign config from cache');
    return campaignConfigCache;
  }

  logger.info('Fetching campaign configuration...');
  try {
    // TODO: Implement actual API call to workflow service to get campaign config
    // This might require multiple calls or a dedicated endpoint that returns the nested structure
    // For now, returning mock data
    const response = await axios.get(`${WORKFLOW_SERVICE_API_URL}/campaign-config`); // Assuming an endpoint exists
    campaignConfigCache = response.data; // Assuming the API returns the data in the desired structure
    lastFetchTime = now;
    logger.info('Campaign configuration fetched and cached successfully.');
    return campaignConfigCache!;
  } catch (error) {
    logger.error('Error fetching campaign configuration:', error);
    // Depending on the error, you might want to throw or return a cached version if available
    throw new Error('Failed to fetch campaign configuration');
  }
};

export const fetchCustomFields = async (): Promise<CustomField[]> => {
    // TODO: Implement caching for custom fields as well
    logger.info('Fetching custom fields...');
    try {
        // TODO: Implement actual API call to workflow service to get custom fields
        const response = await axios.get(`${WORKFLOW_SERVICE_API_URL}/custom-fields`); // Assuming an endpoint exists
        customFieldsCache = response.data; // Assuming the API returns the data
        logger.info('Custom fields fetched and cached successfully.');
        return customFieldsCache!;
    } catch (error) {
        logger.error('Error fetching custom fields:', error);
        throw new Error('Failed to fetch custom fields');
    }
};

// TODO: Add functions to get specific config data from the cache