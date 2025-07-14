// Common campaign API types and interfaces

export interface CampaignApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

// =============================================
// CAMPAIGN GROUP INTERFACES
// =============================================

export interface CampaignGroup {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignGroupRequest {
  name: string;
}

export interface UpdateCampaignGroupRequest {
  name?: string;
}

export interface CampaignGroupsResponse {
  groups: CampaignGroup[];
}

// =============================================
// CAMPAIGN INTERFACES
// =============================================

export interface Campaign {
  id: string;
  campaign_group_id: string;
  name: string;
  priority: number;
  created_at: string;
  updated_at: string;
  campaign_group?: CampaignGroup;
  base_conditions?: BaseCondition[];
  contact_selection_rules?: ContactSelectionRule[];
  base_conditions_count?: number;
  contact_rules_count?: number;
}

export interface CreateCampaignRequest {
  campaign_group_id: string;
  name: string;
  priority: number;
  base_conditions?: CreateBaseConditionRequest[];
  contact_selection_rules?: CreateContactSelectionRuleRequest[];
}

export interface UpdateCampaignRequest {
  name?: string;
  priority?: number;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
}

// =============================================
// BASE CONDITION INTERFACES
// =============================================

export interface BaseCondition {
  id: string;
  campaign_id: string;
  field_name: string;
  operator: string;
  field_value: string;
  data_source: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBaseConditionRequest {
  field_name: string;
  operator: string;
  field_value: string;
  data_source: string;
}

export interface BaseConditionsResponse {
  conditions: BaseCondition[];
}

// =============================================
// CONTACT SELECTION RULE INTERFACES
// =============================================

export interface ContactSelectionRule {
  id: string;
  campaign_id: string;
  rule_priority: number;
  created_at: string;
  updated_at: string;
  conditions?: ContactRuleCondition[];
  outputs?: ContactRuleOutput[];
}

export interface CreateContactSelectionRuleRequest {
  rule_priority: number;
  conditions: CreateContactRuleConditionRequest[];
  outputs: CreateContactRuleOutputRequest[];
}

export interface ContactRuleCondition {
  id: string;
  contact_selection_rule_id: string;
  field_name: string;
  operator: string;
  field_value: string;
  data_source: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactRuleConditionRequest {
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
  relationship_patterns?: string[]; // Optional: relationship types to exclude
  created_at: string;
  updated_at: string;
}

export interface CreateContactRuleOutputRequest {
  related_party_type: string;
  contact_type: string | null;
  relationship_patterns?: string[]; // Optional: relationship types to exclude
}

export interface ContactRulesResponse {
  rules: ContactSelectionRule[];
}

// =============================================
// CUSTOM FIELD INTERFACES
// =============================================

export interface CustomField {
  id: string;
  field_name: string;
  field_column: string; // Maps to field_1, field_2, etc.
  data_type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomFieldRequest {
  field_name: string;
  data_type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
}

export interface CustomFieldsResponse {
  fields: CustomField[];
}

// =============================================
// CONFIGURATION INTERFACES
// =============================================

export interface DataSource {
  value: string;
  label: string;
  fields?: (string | CustomFieldInfo)[];
  description?: string;
}

export interface CustomFieldInfo {
  name: string;
  column: string;
  data_type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
}

export interface Operator {
  value: string;
  label: string;
  description?: string;
}

export interface ContactType {
  value: string;
  label: string;
  description?: string;
}

export interface RelatedPartyType {
  value: string;
  label: string;
  description?: string;
}

export interface DataSourcesResponse {
  data_sources: DataSource[];
}

export interface OperatorsResponse {
  operators: Operator[];
}

export interface ContactTypesResponse {
  contact_types: ContactType[];
}

export interface RelatedPartyTypesResponse {
  related_party_types: RelatedPartyType[];
}

// =============================================
// CAMPAIGN PROCESSING CONFIGURATION
// =============================================

export interface CampaignConfiguration {
  campaign_groups: CampaignGroup[];
  campaigns: Campaign[];
  base_conditions: BaseCondition[];
  contact_selection_rules: ContactSelectionRule[];
  contact_rule_conditions: ContactRuleCondition[];
  contact_rule_outputs: ContactRuleOutput[];
  custom_fields: CustomField[];
}

export interface CampaignConfigurationResponse {
  configuration: CampaignConfiguration;
}

// =============================================
// FORM HELPERS AND VALIDATION
// =============================================

export interface CampaignFormData {
  name: string;
  priority: number;
  campaign_group_id: string;
  base_conditions: CreateBaseConditionRequest[];
  contact_selection_rules: CreateContactSelectionRuleRequest[];
}

export interface CampaignValidationErrors {
  name?: string;
  priority?: string;
  campaign_group_id?: string;
  base_conditions?: string[];
  contact_selection_rules?: string[];
}

// =============================================
// PAGINATION INTERFACES
// =============================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// =============================================
// PROCESSING INTERFACES
// =============================================

export interface ProcessingRequest {
  campaign_group_ids?: string[];
  processing_options?: ProcessingOptions;
}

export interface ProcessingOptions {
  parallel_processing?: boolean;
  max_contacts_per_customer?: number;
  include_uncontactable?: boolean;
}

export interface ProcessingRun {
  id: string;
  request_id: string;
  status: 'running' | 'completed' | 'failed';
  requested_by: string;
  started_at: string;
  completed_at?: string;
  total_duration_ms?: number;
  processed_count?: number;
  success_count?: number;
  error_count?: number;
  processing_options?: ProcessingOptions;
}

export interface ProcessingRunsResponse {
  success: boolean;
  data: ProcessingRun[];
  message: string;
}

export interface CampaignResult {
  id: string;
  processing_run_id: string;
  campaign_id: string;
  campaign_name: string;
  campaign_group_id: string;
  campaign_group_name: string;
  priority: number;
  customers_assigned: number;
  customers_with_contacts: number;
  total_contacts_selected: number;
  processing_duration_ms: number;
  created_at: string;
}

export interface ProcessingStatistics {
  id: string;
  processing_run_id: string;
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
    most_common_error: string;
    processing_errors: number;
  };
  performance_metrics: {
    total_duration_seconds: number;
    customers_per_second: number;
  };
  created_at: string;
}

export interface ProcessingError {
  id: string;
  processing_run_id: string;
  campaign_id?: string;
  customer_cif?: string;
  error_type: string;
  error_message: string;
  error_details?: any;
  created_at: string;
}

export interface CustomerAssignment {
  id: string;
  campaign_result_id: string;
  cif: string;
  assigned_at: string;
  created_at: string;
  campaign_id?: string;
  campaign_name?: string;
  campaign_group_id?: string;
  campaign_group_name?: string;
  request_id?: string;
  processing_run_started_at?: string;
  selected_contacts?: Array<{
    id: string;
    customer_assignment_id: string;
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
    source: string;
    created_at: string;
  }>;
}

export interface SearchAssignmentsRequest {
  cif: string;
  processing_run_id?: string;
}