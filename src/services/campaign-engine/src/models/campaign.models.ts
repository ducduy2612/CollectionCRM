export interface CampaignGroup {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Campaign {
  id: string;
  campaign_group_id: string;
  name: string;
  priority: number;
  created_at: Date;
  updated_at: Date;
  campaign_group?: CampaignGroup;
}

export interface BaseCondition {
  id: string;
  campaign_id: string;
  field_name: string;
  operator: ConditionOperator;
  field_value: string;
  data_source: DataSource;
  created_at: Date;
  updated_at: Date;
}

export interface ContactSelectionRule {
  id: string;
  campaign_id: string;
  rule_priority: number;
  created_at: Date;
  updated_at: Date;
  conditions?: ContactRuleCondition[];
  outputs?: ContactRuleOutput[];
}

export interface ContactRuleCondition {
  id: string;
  contact_selection_rule_id: string;
  field_name: string;
  operator: ConditionOperator;
  field_value: string;
  data_source: DataSource;
  created_at: Date;
  updated_at: Date;
}

export interface ContactRuleOutput {
  id: string;
  contact_selection_rule_id: string;
  related_party_type: RelatedPartyType;
  contact_type: ContactType;
  relationship_patterns?: string[]; // Optional: JSON array of relationship types to exclude (e.g., ['parent', 'spouse'])
  created_at: Date;
  updated_at: Date;
}

export interface CustomField {
  id: string;
  field_name: string;
  field_column: string; // Maps to field_1, field_2, etc.
  data_type: CustomFieldDataType;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// Enums and Types
export type ConditionOperator = 
  | '=' 
  | '!=' 
  | '>' 
  | '>=' 
  | '<' 
  | '<=' 
  | 'LIKE' 
  | 'NOT_LIKE' 
  | 'IN' 
  | 'NOT_IN' 
  | 'IS_NULL' 
  | 'IS_NOT_NULL';

export type DataSource = 
  | 'bank_sync_service.loan_campaign_data' // Unified view with all customer and loan data
  | 'custom_fields';

export type RelatedPartyType = 
  | 'customer'
  | 'reference' // Simplified: use relationship_patterns for filtering
  ;

export type ContactType = 
  | 'mobile'
  | 'home'
  | 'work'
  | 'email'
  | 'all'
  | null;

export type CustomFieldDataType = 
  | 'string'
  | 'number'
  | 'date'
  | 'boolean';

// DTOs for API requests/responses
export interface CreateCampaignGroupRequest {
  name: string;
}

export interface UpdateCampaignGroupRequest {
  name?: string;
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
  campaign_group_id?: string;
  priority?: number;
  base_conditions?: CreateBaseConditionRequest[];
  contact_selection_rules?: CreateContactSelectionRuleRequest[];
}

export interface CreateBaseConditionRequest {
  field_name: string;
  operator: ConditionOperator;
  field_value: string;
  data_source: DataSource;
}

export interface CreateContactSelectionRuleRequest {
  rule_priority: number;
  conditions: CreateContactRuleConditionRequest[];
  outputs: CreateContactRuleOutputRequest[];
}

export interface CreateContactRuleConditionRequest {
  field_name: string;
  operator: ConditionOperator;
  field_value: string;
  data_source: DataSource;
}

export interface CreateContactRuleOutputRequest {
  related_party_type: RelatedPartyType;
  contact_type: ContactType;
  relationship_patterns?: string[]; // Optional: relationship types to exclude
}

export interface CreateCustomFieldRequest {
  field_name: string;
  data_type: CustomFieldDataType;
  description?: string;
}

export interface UpdateCustomFieldRequest {
  field_name?: string;
  data_type?: CustomFieldDataType;
  description?: string;
}

// Response DTOs
export interface CampaignGroupResponse {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  campaigns_count?: number;
}

export interface CampaignResponse {
  id: string;
  campaign_group_id: string;
  name: string;
  priority: number;
  created_at: string;
  updated_at: string;
  campaign_group?: CampaignGroupResponse;
  base_conditions?: BaseConditionResponse[];
  contact_selection_rules?: ContactSelectionRuleResponse[];
}

export interface BaseConditionResponse {
  id: string;
  field_name: string;
  operator: ConditionOperator;
  field_value: string;
  data_source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface ContactSelectionRuleResponse {
  id: string;
  rule_priority: number;
  created_at: string;
  updated_at: string;
  conditions: ContactRuleConditionResponse[];
  outputs: ContactRuleOutputResponse[];
}

export interface ContactRuleConditionResponse {
  id: string;
  field_name: string;
  operator: ConditionOperator;
  field_value: string;
  data_source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface ContactRuleOutputResponse {
  id: string;
  related_party_type: RelatedPartyType;
  contact_type: ContactType;
  relationship_patterns?: string[]; // Optional: relationship types to exclude
  created_at: string;
  updated_at: string;
}

export interface CustomFieldResponse {
  id: string;
  field_name: string;
  field_column: string;
  data_type: CustomFieldDataType;
  description?: string;
  created_at: string;
  updated_at: string;
}