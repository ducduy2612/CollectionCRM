/**
 * User model interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * User creation data interface
 */
export interface UserCreateData {
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active?: boolean;
}

/**
 * User update data interface
 */
export interface UserUpdateData {
  email?: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
}

/**
 * User with roles and permissions interface
 */
export interface UserWithPermissions extends User {
  roles: string[];
  permissions: string[];
}

/**
 * User response interface (for API responses)
 */
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
  permissions?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}