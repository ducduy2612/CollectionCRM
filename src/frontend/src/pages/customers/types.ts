export interface Phone {
  type: 'MOBILE' | 'HOME' | 'WORK' | 'OTHER';
  number: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface Email {
  address: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface Address {
  type: 'HOME' | 'WORK' | 'OTHER';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  district?: string;
  country: string;
  isPrimary: boolean;
  isVerified: boolean;
}

// =============================================
// WORKFLOW SERVICE CONTACT TYPES
// =============================================

export interface WorkflowPhone {
  id: string;
  type: string;
  number: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationDate?: string;
  createdAt: string;
  updatedAt: string;
  cif: string;
  createdBy: string;
  updatedBy: string;
}

export interface WorkflowEmail {
  id: string;
  address: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationDate?: string;
  createdAt: string;
  updatedAt: string;
  cif: string;
  createdBy: string;
  updatedBy: string;
}

export interface WorkflowAddress {
  id: string;
  type: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  district?: string;
  country: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationDate?: string;
  createdAt: string;
  updatedAt: string;
  cif: string;
  createdBy: string;
  updatedBy: string;
}

export interface WorkflowContactInfo {
  phones: WorkflowPhone[];
  addresses: WorkflowAddress[];
  emails: WorkflowEmail[];
}

// Contact form data interfaces
export interface PhoneFormData {
  type: string;
  number: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  verificationDate?: string;
}

export interface EmailFormData {
  address: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  verificationDate?: string;
}

export interface AddressFormData {
  type: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  district?: string;
  country: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  verificationDate?: string;
}

export interface ContactInfo {
  phones: Phone[];
  emails: Email[];
  addresses: Address[];
}

export interface Customer {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  sourceSystem?: string;
  lastSyncedAt?: string;
  isEditable?: boolean;
  cif: string;
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  name: string;
  dateOfBirth?: string;
  nationalId?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  companyName?: string;
  registrationNumber?: string;
  taxId?: string;
  segment: string;
  status: 'ACTIVE' | 'INACTIVE';
  phones: Phone[];
  addresses: Address[];
  emails: Email[];
  loans: Loan[];
  collaterals: any[];
  referenceCustomers?: ReferenceCustomer[];
}

/**
 * Relationship type enum
 */
export enum RelationshipType {
  SPOUSE = 'SPOUSE',
  GUARANTOR = 'GUARANTOR',
  EMPLOYER = 'EMPLOYER',
  EMPLOYEE = 'EMPLOYEE',
  PARENT = 'PARENT',
  CHILD = 'CHILD',
  SIBLING = 'SIBLING',
  BUSINESS_PARTNER = 'BUSINESS_PARTNER',
  OTHER = 'OTHER'
}

/**
 * Reference Customer interface
 * Represents customers who are related to a primary customer
 */
export interface ReferenceCustomer {
  id?: string;
  refCif?: string;
  primaryCif?: string;
  relationshipType: RelationshipType | string;
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  name?: string;
  dateOfBirth?: string;
  nationalId?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  companyName?: string;
  registrationNumber?: string;
  taxId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DueSegmentation {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  sourceSystem: string;
  lastSyncedAt: string | null;
  isEditable: boolean;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  feesAmount: string;
  penaltyAmount: string;
  loanAccountNumber: string;
}

export interface Loan {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  sourceSystem?: string;
  lastSyncedAt?: string | null;
  isEditable?: boolean;
  accountNumber: string;
  cif?: string;
  productType: string;
  originalAmount: number | string;
  currency?: string;
  disbursementDate?: string;
  maturityDate?: string;
  interestRate?: string;
  term?: number;
  paymentFrequency?: string;
  limitAmount?: number | string | null;
  outstanding: number | string;
  remainingAmount?: number | string;
  dueAmount: number | string;
  minPay?: number | string | null;
  nextPaymentDate: string;
  dpd: number;
  delinquencyStatus: 'CURRENT' | 'DELINQUENT' | 'DEFAULT';
  status?: string;
  closeDate?: string | null;
  resolutionCode?: string | null;
  resolutionNotes?: string | null;
  limit?: number;
  collaterals?: any[];
  dueSegmentations?: DueSegmentation[];
}

export interface ActionType {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export interface ActionSubtype {
  subtype_id: string;
  subtype_code: string;
  subtype_name: string;
  subtype_description: string;
  display_order: number;
}

export interface ActionResult {
  result_id: string;
  result_code: string;
  result_name: string;
  result_description: string;
  display_order: number;
}

export interface CustomerAction {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  cif: string;
  loanAccountNumber: string;
  agentId: string;
  actionTypeId: string;
  actionSubtypeId: string;
  actionResultId: string;
  actionDate: string;
  fUpdate: string;
  notes: string;
  dueAmount?: number | string;
  dpd?: number;
  callTraceId?: string;
  visitLatitude?: string;
  visitLongitude?: string;
  visitAddress?: string;
  agent?: AgentDetail;
  actionType?: ActionType;
  actionSubtype?: ActionSubtype;
  actionResult?: ActionResult;
}

export interface AgentDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  type: string;
  team: string;
  isActive: boolean;
  userId: string;
}

export interface Payment {
  date: string;
  amount: number;
  method: string;
}

// =============================================
// STATUS DICTIONARY TYPES
// =============================================

/**
 * Base interface for status dictionary items
 * Used for all status dictionaries (customer, collateral, processing state, etc.)
 */
export interface StatusDictItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string; // Hex color code for UI
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Customer Status Dictionary Item
 */
export interface CustomerStatusDictItem extends StatusDictItem {}

/**
 * Collateral Status Dictionary Item
 */
export interface CollateralStatusDictItem extends StatusDictItem {}

/**
 * Processing State Dictionary Item
 */
export interface ProcessingStateDictItem extends StatusDictItem {}

/**
 * Processing Substate Dictionary Item
 */
export interface ProcessingSubstateDictItem extends StatusDictItem {}

/**
 * Lending Violation Status Dictionary Item
 */
export interface LendingViolationStatusDictItem extends StatusDictItem {}

/**
 * Recovery Ability Status Dictionary Item
 */
export interface RecoveryAbilityStatusDictItem extends StatusDictItem {}

// =============================================
// STATUS HISTORY TYPES
// =============================================

/**
 * Base interface for status history items
 */
export interface BaseStatusHistoryItem {
  id: string;
  cif: string;
  agentId: string;
  actionDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  agent?: AgentDetail;
}

/**
 * Customer Status History Item
 */
export interface CustomerStatusHistoryItem extends BaseStatusHistoryItem {
  statusId: string;
  status?: CustomerStatusDictItem;
}

/**
 * Collateral Status History Item
 */
export interface CollateralStatusHistoryItem extends BaseStatusHistoryItem {
  collateralId: string;
  statusId: string;
  status?: CollateralStatusDictItem;
}

/**
 * Processing State Status History Item
 */
export interface ProcessingStateStatusHistoryItem extends BaseStatusHistoryItem {
  stateId: string;
  substateId?: string;
  state?: ProcessingStateDictItem;
  substate?: ProcessingSubstateDictItem;
}

/**
 * Lending Violation Status History Item
 */
export interface LendingViolationStatusHistoryItem extends BaseStatusHistoryItem {
  statusId: string;
  status?: LendingViolationStatusDictItem;
}

/**
 * Recovery Ability Status History Item
 */
export interface RecoveryAbilityStatusHistoryItem extends BaseStatusHistoryItem {
  statusId: string;
  status?: RecoveryAbilityStatusDictItem;
}

// =============================================
// COMBINED STATUS DATA TYPES
// =============================================

/**
 * Customer Status Data - includes current status and history
 */
export interface CustomerStatusData {
  // Current status values (latest from each category)
  current: {
    customerStatus?: CustomerStatusDictItem;
    collateralStatus?: CollateralStatusDictItem;
    processingState?: ProcessingStateDictItem;
    processingSubstate?: ProcessingSubstateDictItem;
    lendingViolation?: LendingViolationStatusDictItem;
    recoveryAbility?: RecoveryAbilityStatusDictItem;
    lastUpdated?: string;
  };
  
  // Status history for each category
  history: {
    customerStatus: CustomerStatusHistoryItem[];
    collateralStatus: CollateralStatusHistoryItem[];
    processingState: ProcessingStateStatusHistoryItem[];
    lendingViolation: LendingViolationStatusHistoryItem[];
    recoveryAbility: RecoveryAbilityStatusHistoryItem[];
  };
}

// =============================================
// API RESPONSE TYPES
// =============================================

/**
 * API Response for status dictionaries
 */
export interface StatusDictionariesResponse {
  customerStatus: CustomerStatusDictItem[];
  collateralStatus: CollateralStatusDictItem[];
  processingState: ProcessingStateDictItem[];
  processingSubstate: ProcessingSubstateDictItem[];
  lendingViolation: LendingViolationStatusDictItem[];
  recoveryAbility: RecoveryAbilityStatusDictItem[];
}

/**
 * API Response for customer status data
 */
export interface CustomerStatusResponse {
  cif: string;
  statusData: CustomerStatusData;
}

// =============================================
// FORM AND UI TYPES
// =============================================

/**
 * Status selection option for forms
 */
export interface StatusSelectOption {
  value: string;
  label: string;
  description?: string;
  color?: string;
  disabled?: boolean;
}

/**
 * Status update request
 */
export interface StatusUpdateRequest {
  cif: string;
  statusType: 'customer' | 'collateral' | 'processingState' | 'lendingViolation' | 'recoveryAbility';
  statusId: string;
  stateId?: string; // For processing state only
  substateId?: string; // For processing state only
  collateralId?: string; // For collateral status only
  notes?: string;
  actionDate?: string; // Defaults to current timestamp if not provided
}

/**
 * Status display configuration
 */
export interface StatusDisplayConfig {
  showHistory: boolean;
  showTimestamps: boolean;
  showAgentInfo: boolean;
  showNotes: boolean;
  maxHistoryItems?: number;
}

// =============================================
// BACKWARD COMPATIBILITY
// =============================================

/**
 * @deprecated Use CustomerStatusData instead
 * Legacy CustomerStatus interface - kept for backward compatibility
 */
export interface CustomerStatus {
  customerStatus: string;
  collateralStatus: string;
  processingState: string;
  lendingViolation: string;
  recoveryAbility: string;
}