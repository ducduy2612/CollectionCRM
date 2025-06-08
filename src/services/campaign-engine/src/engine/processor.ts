import logger from '../utils/logger';
import { CampaignGroup, Campaign, BaseCondition, ContactSelectionRule, ContactRuleCondition, ContactRuleOutput, CustomField } from '../config/campaign.config';
import { fetchCustomerAndLoanData, LoanData, ReferenceCustomerData } from '../services/bankSync.service';

interface CustomerProcessedResult {
  customerId: string;
  assignedCampaignId: string | null;
  selectedContacts: { type: string; number: string; relatedPartyType: string; }[];
}

interface CustomerData {
  id: string;
  phones: { type: string; number: string; }[];
  loans: LoanData[];
  // Add other customer fields as needed for condition evaluation
  // e.g., segment, status, custom_fields (if stored directly in bank-sync-service)
  reference_customers?: ReferenceCustomerData[];
  [key: string]: any; // For dynamic custom fields
}

// In-memory cache for campaign configurations and custom fields
let cachedCampaignGroups: CampaignGroup[] = [];
let cachedCustomFields: CustomField[] = [];

export const setCampaignConfigCache = (config: CampaignGroup[]) => {
  cachedCampaignGroups = config.sort((a: CampaignGroup, b: CampaignGroup) => a.priority - b.priority); // Sort by group priority
  cachedCampaignGroups.forEach(group => {
    group.campaigns.sort((a: Campaign, b: Campaign) => a.priority - b.priority); // Sort campaigns within group
    group.campaigns.forEach((campaign: Campaign) => {
      campaign.contact_selection_rules.sort((a: ContactSelectionRule, b: ContactSelectionRule) => a.rule_priority - b.rule_priority); // Sort contact rules
    });
  });
  logger.info('Campaign configuration cache updated and sorted.');
};

export const setCustomFieldsCache = (customFields: CustomField[]) => {
  cachedCustomFields = customFields;
  logger.info('Custom fields cache updated.');
};

/**
 * Evaluates a single condition against customer data.
 * @param condition The condition to evaluate.
 * @param customerData The customer's data.
 * @returns True if the condition is met, false otherwise.
 */
const evaluateCondition = (condition: BaseCondition | ContactRuleCondition, customerData: CustomerData): boolean => {
  const { field_name, operator, field_value, data_source } = condition;

  let actualValue: any;

  // Determine the actual value based on data_source
  if (data_source === 'bank_sync_service.customers') {
    actualValue = (customerData as any)[field_name];
  } else if (data_source === 'bank_sync_service.loans') {
    // For loan-based conditions, check if any loan satisfies the condition
    return customerData.loans.some((loan: LoanData) => {
      const loanValue = (loan as any)[field_name]; // Use 'any' for dynamic field access
      return applyOperator(loanValue, operator, field_value);
    });
  } else if (data_source === 'custom_fields') {
    const customFieldDef = cachedCustomFields.find(cf => cf.field_name === field_name);
    if (!customFieldDef) {
      logger.warn(`Custom field '${field_name}' not found in cache.`);
      return false;
    }
    // TODO: Implement logic to derive custom field value based on source_mapping
    // For now, assume custom fields are directly available on customerData for simplicity
    actualValue = (customerData as any)[field_name];
  } else {
    logger.warn(`Unsupported data source: ${data_source}`);
    return false;
  }

  return applyOperator(actualValue, operator, field_value);
};

/**
 * Applies the specified operator for condition evaluation.
 * @param actualValue The actual value from customer data.
 * @param operator The comparison operator.
 * @param expectedValue The value to compare against.
 * @returns True if the comparison is true, false otherwise.
 */
const applyOperator = (actualValue: any, operator: string, expectedValue: string): boolean => {
  // Basic type conversion for comparison
  let parsedActual: any = actualValue;
  let parsedExpected: any = expectedValue;

  // Attempt to convert to number if possible for numeric comparisons
  if (!isNaN(Number(actualValue)) && !isNaN(Number(expectedValue))) {
    parsedActual = Number(actualValue);
    parsedExpected = Number(expectedValue);
  }

  switch (operator) {
    case '=':
      return parsedActual == parsedExpected; // Use == for loose equality to handle type coercion
    case '!=':
      return parsedActual != parsedExpected;
    case '>':
      return parsedActual > parsedExpected;
    case '<':
      return parsedActual < parsedExpected;
    case '>=':
      return parsedActual >= parsedExpected;
    case '<=':
      return parsedActual <= parsedExpected;
    case 'LIKE':
      // Basic LIKE implementation (case-insensitive contains)
      return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
    // TODO: Add more operators as needed (e.g., IN, NOT IN, BETWEEN)
    default:
      logger.warn(`Unsupported operator: ${operator}`);
      return false;
  }
};

/**
 * Evaluates all base conditions for a given campaign against customer data.
 * @param campaign The campaign object.
 * @param customerData The customer's data.
 * @returns True if all base conditions are met, false otherwise.
 */
const evaluateBaseConditions = (campaign: Campaign, customerData: CustomerData): boolean => {
  if (!campaign.base_conditions || campaign.base_conditions.length === 0) {
    return true; // No base conditions means always eligible
  }
  return campaign.base_conditions.every((condition: BaseCondition) => evaluateCondition(condition, customerData));
};

/**
 * Evaluates contact selection rules and collects eligible contact information.
 * @param campaign The assigned campaign.
 * @param customerData The customer's data.
 * @returns An array of selected contact information.
 */
const evaluateContactSelectionRules = (campaign: Campaign, customerData: CustomerData): { type: string; number: string; relatedPartyType: string; }[] => {
  const selectedContacts: { type: string; number: string; relatedPartyType: string; }[] = [];
  const addedContacts = new Set<string>(); // To prevent duplicate contacts

  for (const rule of campaign.contact_selection_rules) {
    const allConditionsMet = rule.contact_rule_conditions.every((condition: ContactRuleCondition) => evaluateCondition(condition, customerData));

    if (allConditionsMet) {
      for (const output of rule.contact_rule_outputs) {
        const { related_party_type, contact_type } = output;

        let contactsToConsider: { type: string; number: string; }[] = [];

        if (related_party_type === 'customer') {
          contactsToConsider = customerData.phones;
        } else if (related_party_type === 'reference_customer_parent' && customerData.reference_customers) {
          const parentRef = customerData.reference_customers.find(ref => ref.type === 'parent');
          if (parentRef) contactsToConsider = parentRef.phones;
        } else if (related_party_type === 'reference_customer_all' && customerData.reference_customers) {
          customerData.reference_customers.forEach(ref => {
            contactsToConsider.push(...ref.phones);
          });
        }

        contactsToConsider.forEach(phone => {
          if (contact_type === 'all' || phone.type === contact_type) {
            const contactKey = `${phone.type}-${phone.number}`;
            if (!addedContacts.has(contactKey)) {
              selectedContacts.push({ ...phone, relatedPartyType: related_party_type });
              addedContacts.add(contactKey);
            }
          }
        });
      }
    }
  }
  return selectedContacts;
};

/**
 * Main processing function for a batch of customer IDs.
 * @param customerIds An array of customer IDs to process.
 * @returns A promise that resolves to an array of processed customer results.
 */
export const processCustomerBatch = async (customerIds: string[]): Promise<CustomerProcessedResult[]> => {
  logger.info(`Processing batch of ${customerIds.length} customers.`);
  const results: CustomerProcessedResult[] = [];

  // 1. Fetch customer and loan data from bank-sync-service (batched)
  let customersData: CustomerData[] = [];
  try {
    customersData = await fetchCustomerAndLoanData(customerIds);
  } catch (error) {
    logger.error(`Failed to fetch customer data for batch. Skipping batch.`, error);
    return customerIds.map(id => ({ customerId: id, assignedCampaignId: null, selectedContacts: [] }));
  }

  const customerMap = new Map<string, CustomerData>();
  customersData.forEach(customer => customerMap.set(customer.id, customer));

  // Keep track of customers already assigned to a campaign in this batch
  const assignedCustomerIds = new Set<string>();

  // 2. Campaign Group Prioritization
  for (const group of cachedCampaignGroups) {
    for (const campaign of group.campaigns) {
      // Iterate over customers in the batch
      for (const customerId of customerIds) {
        if (assignedCustomerIds.has(customerId)) {
          continue; // Skip if already assigned
        }

        const customerData = customerMap.get(customerId);
        if (!customerData) {
          logger.warn(`Customer data not found for ID: ${customerId}. Skipping.`);
          continue;
        }

        // 3. Base Condition Evaluation
        if (evaluateBaseConditions(campaign, customerData)) {
          logger.info(`Customer ${customerId} eligible for campaign ${campaign.name} (${campaign.id})`);

          // 4. Customer Assignment and Group Exclusion
          assignedCustomerIds.add(customerId); // Mark as assigned

          // 5. Contact Selection Rule Evaluation & Contact Information Inclusion
          const selectedContacts = evaluateContactSelectionRules(campaign, customerData);

          results.push({
            customerId: customerId,
            assignedCampaignId: campaign.id,
            selectedContacts: selectedContacts,
          });
          // No need to break here, as the outer loop will continue to the next customerId
          // and the 'assignedCustomerIds' check will handle the exclusion.
        }
      }
    }
  }

  // Add customers who were not assigned to any campaign
  for (const customerId of customerIds) {
    if (!assignedCustomerIds.has(customerId)) {
      results.push({
        customerId: customerId,
        assignedCampaignId: null,
        selectedContacts: [],
      });
    }
  }

  logger.info(`Finished processing batch. Results for ${results.length} customers.`);
  return results;
};