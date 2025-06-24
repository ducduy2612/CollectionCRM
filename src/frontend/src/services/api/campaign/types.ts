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
  created_at: string;
  updated_at: string;
}

export interface CreateContactRuleOutputRequest {
  related_party_type: string;
  contact_type: string;
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
  fields?: string[];
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