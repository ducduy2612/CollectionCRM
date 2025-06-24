// Optimized models for campaign-centric processing with PostgreSQL queries

// Batch processing interfaces
export interface BatchProcessingRequest {
  request_id: string;
  campaign_group_ids?: string[]; // Optional: process specific groups only
  requested_by: string;
  processing_options: ProcessingOptions;
}

export interface ProcessingOptions {
  parallel_processing: boolean;
  include_unverified_contacts: boolean;
  max_contacts_per_customer: number;
}

export interface BatchProcessingResult {
  request_id: string;
  processed_count: number;
  success_count: number;
  error_count: number;
  campaign_results: CampaignProcessingResult[];
  errors: ProcessingError[];
  processing_summary: ProcessingSummary;
  started_at: string;
  completed_at: string;
  total_duration_ms: number;
}

// Campaign processing results
export interface CampaignProcessingResult {
  campaign_id: string;
  campaign_name: string;
  campaign_group_id: string;
  campaign_group_name: string;
  priority: number;
  customers_assigned: number;
  customers_with_contacts: number;
  total_contacts_selected: number;
  processing_duration_ms: number;
  customer_assignments: CustomerAssignment[];
}

export interface CustomerAssignment {
  customer_id: string;
  cif: string;
  account_number: string;
  assigned_at: string;
  selected_contacts: SelectedContact[];
}

export interface SelectedContact {
  contact_id: string;
  contact_type: string;
  contact_value: string;
  related_party_type: string;
  related_party_cif: string;
  related_party_name?: string;
  relationship_type?: string;
  rule_priority: number;
  is_primary: boolean;
  is_verified: boolean;
  source: 'bank_sync' | 'user_input';
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
}

export interface CustomFieldMetadata {
  field_name: string;
  data_type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
}

// Error handling
export interface ProcessingError {
  campaign_id?: string;
  customer_id?: string;
  cif?: string;
  account_number?: string;
  error_code: string;
  error_message: string;
  stack_trace?: string;
}

// Processing summary
export interface ProcessingSummary {
  total_customers: number;
  total_campaigns_processed: number;
  total_groups_processed: number;
  customers_with_assignments: number;
  customers_without_assignments: number;
  campaign_assignments_by_group: Record<string, number>;
  most_assigned_campaign: {
    campaign_id: string;
    campaign_name: string;
    assignment_count: number;
  };
  total_contacts_selected: number;
  total_processing_duration_ms: number;
  total_errors: number;
  error_summary: {
    campaign_errors: number;
    processing_errors: number;
    most_common_error: string;
  };
  performance_metrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  total_database_queries: number;
  average_query_duration_ms: number;
  cache_hit_rate: number;
  customers_per_second: number;
}

// Data source field mappings - only necessary fields for campaign evaluation
export const DATA_SOURCE_FIELDS = {
  'bank_sync_service.customers': [
    'cif', 'segment', 'status'
  ],
  'bank_sync_service.customer_aggregates': [
    'cif', 'segment', 'customer_status', 'total_loans', 'active_loans', 'overdue_loans',
    'client_outstanding', 'total_due_amount', 'overdue_outstanding', 'max_dpd', 
    'avg_dpd', 'utilization_ratio'
  ],
  'bank_sync_service.loans': [
    'account_number', 'cif', 'product_type', 'outstanding', 'due_amount', 
    'dpd', 'delinquency_status', 'status'
  ],
  'custom_fields': [] // Dynamic based on loan_custom_fields.fields JSONB
} as const;