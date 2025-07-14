// Common workflow API types and interfaces
export interface WorkflowApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

// =============================================
// STATUS HISTORY INTERFACES
// =============================================

export interface StatusHistoryItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  cif: string;
  agentId: string;
  actionDate: string;
  statusId: string;
  stateId?: string;
  substateId?: string;
  notes: string | null;
  agent: {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
    employeeId: string;
    name: string;
    email: string;
    phone: string | null;
    type: string;
    team: string;
    isActive: boolean;
    userId: string;
  };
  status?: {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    code: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    displayOrder: number;
  };
  state?: {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    code: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    displayOrder: number;
  };
  substate?: {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    code: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    displayOrder: number;
  }
}

export interface StatusHistoryResponse {
  items: StatusHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface RecordStatusRequest {
  cif: string;
  statusId: string;
  stateId?: string;
  substateId?: string;
  collateralNumber?: string;
  actionDate?: string;
  notes?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// =============================================
// ACTION INTERFACES
// =============================================

export interface ActionsResponse {
  actions: any[]; // CustomerAction[] - imported from types
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface BulkActionRequest {
  cif: string;
  loanAccountNumber: string;
  actionTypeId: string;
  actionSubtypeId: string;
  actionResultId: string;
  actionDate?: string;
  promiseDate?: string;
  promiseAmount?: number;
  dueAmount?: number;
  dpd?: number;
  fUpdate?: string;
  notes?: string;
  visitLocation?: any;
}

export interface BulkActionResponse {
  successful: Array<{
    index: number;
    actionId: string;
    cif: string;
    loanAccountNumber: string;
  }>;
  failed: Array<{
    index: number;
    error: string;
    actionData: any;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// =============================================
// CASE INTERFACES
// =============================================

export interface CaseStatusResponse {
  caseStatus: string;
  activeCases: number;
  lastActivity: string;
}

export interface CasesResponse {
  cases: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// =============================================
// ASSIGNMENT INTERFACES
// =============================================

export interface Assignment {
  id: string;
  cif: string;
  assignedCallAgentId: string | null;
  assignedFieldAgentId: string | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  // Customer data will be joined from bank service
  customer?: {
    cif: string;
    name: string;
    companyName?: string;
    segment: string;
    status: string;
  };
}

export interface AssignmentsResponse {
  assignments: Assignment[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface AgentInfo {
  id: string;
  name: string;
  email: string;
  type: string;
  team: string;
}

export interface AssignmentHistoryResponse {
  history: AssignmentHistoryItem[];
}

export interface AssignmentHistoryItem {
  id: string;
  cif: string;
  assignedCallAgentId: string | null;
  assignedFieldAgentId: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  assignedCallAgent?: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    type: string;
    team: string;
    isActive: boolean;
  } | null;
  assignedFieldAgent?: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    type: string;
    team: string;
    isActive: boolean;
  } | null;
}

export interface BulkAssignmentResponse {
  batchId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  failedRows: number;
  skippedRows: number;
  errors: string[];
  hasMoreErrors: boolean;
}

export interface BatchStatusResponse {
  batchId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  failedRows: number;
  skippedRows: number;
  errors: string[];
  hasMoreErrors: boolean;
}