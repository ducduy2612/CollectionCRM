/**
 * Role model interface
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Role creation data interface
 */
export interface RoleCreateData {
  name: string;
  description?: string;
}

/**
 * Role update data interface
 */
export interface RoleUpdateData {
  description?: string;
}

/**
 * Permission model interface
 */
export interface Permission {
  id: string;
  role_id: string;
  resource: string;
  action: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Permission creation data interface
 */
export interface PermissionCreateData {
  role_id: string;
  resource: string;
  action: string;
}

/**
 * Role with permissions interface
 */
export interface RoleWithPermissions extends Role {
  permissions: string[];
}

/**
 * Role response interface (for API responses)
 */
export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}