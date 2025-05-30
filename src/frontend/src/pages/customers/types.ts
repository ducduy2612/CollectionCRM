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

export interface CustomerAction {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  cif: string;
  loanAccountNumber: string;
  agentId: string;
  type: 'CALL' | 'SMS' | 'EMAIL' | 'VISIT' | 'PAYMENT' | 'NOTE';
  subtype: string;
  actionResult: string;
  actionDate: string;
  fUpdate: string;
  notes: string;
  callTraceId?: string;
  visitLatitude?: string;
  visitLongitude?: string;
  visitAddress?: string;
  agent?: AgentDetail;
}

export interface AgentDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
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

export interface CustomerStatus {
  customerStatus: string;
  collateralStatus: string;
  processingState: string;
  lendingViolation: string;
  recoveryAbility: string;
}