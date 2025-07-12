// Optimized models for campaign-centric processing with PostgreSQL queries

// Batch processing interfaces
export interface BatchProcessingRequest {
  request_id: string;
  campaign_group_ids?: string[]; // Optional: process specific groups only
  requested_by: string;
  requested_by_id: string;
  processing_options: ProcessingOptions;
}

export interface ProcessingOptions {
  parallel_processing: boolean;
  max_contacts_per_customer: number;
}

export interface BatchProcessingResult {
  request_id: string;
  processed_count: number;
  success_count: number;
  error_count: number;
  started_at: string;
  completed_at: string;
  total_duration_ms: number;
}


// Campaign configuration for processing
export interface CampaignConfiguration {
  campaign_groups: ProcessingCampaignGroup[];
  custom_fields: CustomFieldMetadata[];
}

export interface ProcessingCampaignGroup {
  id: string;
  name: string;
  campaigns: ProcessingCampaign[];
}

export interface ProcessingCampaign {
  id: string;
  name: string;
  priority: number;
  base_conditions: ProcessingCondition[];
  contact_selection_rules: ProcessingContactRule[];
}

export interface ProcessingCondition {
  id: string;
  field_name: string;
  operator: string;
  field_value: string;
  data_source: string;
}

export interface ProcessingContactRule {
  id: string;
  rule_priority: number;
  conditions: ProcessingCondition[];
  outputs: ProcessingContactOutput[];
}

export interface ProcessingContactOutput {
  id: string;
  related_party_type: string;
  contact_type: string;
  relationship_patterns?: string[]; // Optional: relationship types to exclude (e.g., ['parent', 'spouse', 'father'])
}

export interface CustomFieldMetadata {
  field_name: string;
  data_type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
}


// Field metadata for the loan_campaign_data view
export interface FieldMetadata {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
}

// Define all available fields with their types
export const LOAN_CAMPAIGN_FIELDS: Record<string, FieldMetadata> = {
  // Customer fields (cif is the primary identifier)
  segment: { name: 'segment', type: 'string', description: 'Customer segment' },
  customer_status: { name: 'customer_status', type: 'string', description: 'Customer status' },
  
  // Loan-specific fields
  account_number: { name: 'account_number', type: 'string', description: 'Loan account number' },
  product_type: { name: 'product_type', type: 'string', description: 'Loan product type' },
  loan_outstanding: { name: 'loan_outstanding', type: 'number', description: 'Loan outstanding amount' },
  loan_due_amount: { name: 'loan_due_amount', type: 'number', description: 'Loan due amount' },
  loan_dpd: { name: 'loan_dpd', type: 'number', description: 'Loan days past due' },
  delinquency_status: { name: 'delinquency_status', type: 'string', description: 'Loan delinquency status' },
  loan_status: { name: 'loan_status', type: 'string', description: 'Loan status' },
  original_amount: { name: 'original_amount', type: 'number', description: 'Original loan amount' },
  
  // Customer aggregates
  total_loans: { name: 'total_loans', type: 'number', description: 'Total number of loans' },
  active_loans: { name: 'active_loans', type: 'number', description: 'Number of active loans' },
  overdue_loans: { name: 'overdue_loans', type: 'number', description: 'Number of overdue loans' },
  client_outstanding: { name: 'client_outstanding', type: 'number', description: 'Total outstanding across all loans' },
  total_due_amount: { name: 'total_due_amount', type: 'number', description: 'Total due amount across all loans' },
  overdue_outstanding: { name: 'overdue_outstanding', type: 'number', description: 'Total overdue outstanding' },
  overdue_due_amount: { name: 'overdue_due_amount', type: 'number', description: 'Total overdue due amount' },
  max_dpd: { name: 'max_dpd', type: 'number', description: 'Maximum days past due' },
  avg_dpd: { name: 'avg_dpd', type: 'number', description: 'Average days past due' },
  utilization_ratio: { name: 'utilization_ratio', type: 'number', description: 'Loan utilization ratio' }
};

// Helper function to check if a field is numeric
export const isNumericField = (fieldName: string): boolean => {
  const field = LOAN_CAMPAIGN_FIELDS[fieldName];
  return field?.type === 'number';
};

// Data source field mappings - using unified loan_campaign_data view
export const DATA_SOURCE_FIELDS = {
  'bank_sync_service.loan_campaign_data': Object.keys(LOAN_CAMPAIGN_FIELDS),
  'custom_fields': [] // Dynamic based on custom_fields JSONB column
} as const;