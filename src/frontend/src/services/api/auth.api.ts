import { apiClient } from './client';
import { User } from '../../hooks/useAuth';

export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo?: {
    deviceId?: string;
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface AuthApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface LoginResponseData {
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshTokenResponseData {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ValidateTokenResponseData {
  valid: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

// User Management Types
export interface UserFilters {
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface UserData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsersListResponse {
  users: UserResponse[];
  pagination: PaginationResponse;
}

export interface UserActivationResponse {
  id: string;
  username: string;
  is_active: boolean;
  updated_at: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    deviceType: string;
    browser: string;
    os: string;
    ip: string;
  };
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
}

export interface UserSessionsResponse {
  sessions: UserSession[];
}

// Role Management Types
export interface RoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleData {
  description?: string;
  permissions?: string[];
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface RolesListResponse {
  roles: RoleResponse[];
}

export interface RoleUsersResponse {
  users: UserResponse[];
  pagination: PaginationResponse;
}

export interface RoleAssignmentResponse {
  roleId: string;
  assignedUsers: UserResponse[];
}

export interface RoleDeletionResponse {
  id: string;
  deleted: boolean;
}

// Helper function to get device info
const getDeviceInfo = () => {
  return {
    deviceId: localStorage.getItem('deviceId') || `device-${Date.now()}`,
    deviceType: 'DESKTOP',
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
             navigator.userAgent.includes('Firefox') ? 'Firefox' :
             navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
    operatingSystem: navigator.platform,
    userAgent: navigator.userAgent
  };
};

export const authApi = {
  login: async (data: { username: string; password: string }): Promise<LoginResponseData> => {
    const loginRequest: LoginRequest = {
      username: data.username,
      password: data.password,
      deviceInfo: getDeviceInfo()
    };
    
    const response = await apiClient.post<AuthApiResponse<LoginResponseData>>('/auth/login', loginRequest);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Login failed');
    }
    
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    // Call logout API while token is still valid
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponseData> => {
    const response = await apiClient.post<AuthApiResponse<RefreshTokenResponseData>>('/auth/token/refresh', {
      refreshToken
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Token refresh failed');
    }
    
    return response.data.data;
  },

  validateToken: async (token: string): Promise<User> => {
    const response = await apiClient.post<AuthApiResponse<ValidateTokenResponseData>>('/auth/token/validate', {
      token
    });
    
    if (!response.data.success || !response.data.data.valid) {
      throw new Error('Token is invalid');
    }
    
    const userData = response.data.data.user;
    
    // Ensure name exists and is a string before calling split
    const userName = userData.name || userData.username || 'User';
    const userInitials = typeof userName === 'string'
      ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      : 'U';
    
    return {
      id: userData.id,
      name: userName,
      email: userData.email,
      role: userData.roles[0] || 'USER', // Take first role as primary
      initials: userInitials
    };
  },

  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No token available');
    }
    
    return await authApi.validateToken(token);
  },

  forgotPassword: async (username: string, email: string): Promise<void> => {
    const response = await apiClient.post<AuthApiResponse<any>>('/auth/password/reset', {
      username,
      email
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password reset request failed');
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await apiClient.post<AuthApiResponse<any>>('/auth/password/change', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password change failed');
    }
  },

  // User Management APIs

  /**
   * Get users with optional filters and pagination
   * @param filters - Optional filters for username, email, role, and active status
   * @param pagination - Optional pagination parameters
   * @returns Promise<UsersListResponse>
   */
  getUsers: async (filters: UserFilters = {}, pagination: PaginationParams = {}): Promise<UsersListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.username) params.append('username', filters.username);
    if (filters.email) params.append('email', filters.email);
    if (filters.role) params.append('role', filters.role);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.pageSize) params.append('pageSize', pagination.pageSize.toString());

    const response = await apiClient.get<AuthApiResponse<UsersListResponse>>(`/auth/users?${params.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to retrieve users');
    }
    
    return response.data.data;
  },

  /**
   * Create a new user
   * @param userData - User data for creation
   * @returns Promise<UserResponse>
   */
  createUser: async (userData: UserData): Promise<UserResponse> => {
    const response = await apiClient.post<AuthApiResponse<UserResponse>>('/auth/users', userData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'User creation failed');
    }
    
    return response.data.data;
  },

  /**
   * Get user by ID
   * @param id - User ID
   * @returns Promise<UserResponse>
   */
  getUserById: async (id: string): Promise<UserResponse> => {
    const response = await apiClient.get<AuthApiResponse<UserResponse>>(`/auth/users/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to retrieve user');
    }
    
    return response.data.data;
  },

  /**
   * Update user by ID
   * @param id - User ID
   * @param userData - Updated user data
   * @returns Promise<UserResponse>
   */
  updateUser: async (id: string, userData: UpdateUserData): Promise<UserResponse> => {
    const response = await apiClient.put<AuthApiResponse<UserResponse>>(`/auth/users/${id}`, userData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'User update failed');
    }
    
    return response.data.data;
  },

  /**
   * Activate user by ID
   * @param id - User ID
   * @returns Promise<UserActivationResponse>
   */
  activateUser: async (id: string): Promise<UserActivationResponse> => {
    const response = await apiClient.put<AuthApiResponse<UserActivationResponse>>(`/auth/users/${id}/activate`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to activate user');
    }
    
    return response.data.data;
  },

  /**
   * Deactivate user by ID
   * @param id - User ID
   * @returns Promise<UserActivationResponse>
   */
  deactivateUser: async (id: string): Promise<UserActivationResponse> => {
    const response = await apiClient.put<AuthApiResponse<UserActivationResponse>>(`/auth/users/${id}/deactivate`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to deactivate user');
    }
    
    return response.data.data;
  },

  /**
   * Get user sessions by user ID
   * @param id - User ID
   * @returns Promise<UserSessionsResponse>
   */
  getUserSessions: async (id: string): Promise<UserSessionsResponse> => {
    const response = await apiClient.get<AuthApiResponse<UserSessionsResponse>>(`/auth/users/${id}/sessions`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to retrieve user sessions');
    }
    
    return response.data.data;
  },

  /**
   * Terminate all user sessions by user ID
   * @param id - User ID
   * @returns Promise<{ terminatedSessions: number }>
   */
  terminateUserSessions: async (id: string): Promise<{ terminatedSessions: number }> => {
    const response = await apiClient.delete<AuthApiResponse<{ terminatedSessions: number }>>(`/auth/users/${id}/sessions`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to terminate user sessions');
    }
    
    return response.data.data;
  },

  /**
   * Terminate a specific user session
   * @param userId - User ID
   * @param sessionId - Session ID
   * @returns Promise<{ terminated: boolean }>
   */
  terminateUserSession: async (userId: string, sessionId: string): Promise<{ terminated: boolean }> => {
    const response = await apiClient.delete<AuthApiResponse<{ terminated: boolean }>>(`/auth/users/${userId}/sessions/${sessionId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to terminate user session');
    }
    
    return response.data.data;
  },

  // Role Management APIs

  /**
   * Get all roles
   * @returns Promise<RolesListResponse>
   */
  getRoles: async (): Promise<RolesListResponse> => {
    const response = await apiClient.get<AuthApiResponse<RolesListResponse>>('/auth/roles');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to retrieve roles');
    }
    
    return response.data.data;
  },

  /**
   * Create a new role
   * @param roleData - Role data for creation
   * @returns Promise<RoleResponse>
   */
  createRole: async (roleData: RoleData): Promise<RoleResponse> => {
    const response = await apiClient.post<AuthApiResponse<RoleResponse>>('/auth/roles', roleData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Role creation failed');
    }
    
    return response.data.data;
  },

  /**
   * Get role by ID
   * @param id - Role ID
   * @returns Promise<RoleResponse>
   */
  getRoleById: async (id: string): Promise<RoleResponse> => {
    const response = await apiClient.get<AuthApiResponse<RoleResponse>>(`/auth/roles/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to retrieve role');
    }
    
    return response.data.data;
  },

  /**
   * Update role by ID
   * @param id - Role ID
   * @param roleData - Updated role data
   * @returns Promise<RoleResponse>
   */
  updateRole: async (id: string, roleData: UpdateRoleData): Promise<RoleResponse> => {
    const response = await apiClient.put<AuthApiResponse<RoleResponse>>(`/auth/roles/${id}`, roleData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Role update failed');
    }
    
    return response.data.data;
  },

  /**
   * Delete role by ID
   * @param id - Role ID
   * @returns Promise<RoleDeletionResponse>
   */
  deleteRole: async (id: string): Promise<RoleDeletionResponse> => {
    const response = await apiClient.delete<AuthApiResponse<RoleDeletionResponse>>(`/auth/roles/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete role');
    }
    
    return response.data.data;
  },

  /**
   * Get users with a specific role
   * @param id - Role ID
   * @param pagination - Optional pagination parameters
   * @returns Promise<RoleUsersResponse>
   */
  getUsersWithRole: async (id: string, pagination: PaginationParams = {}): Promise<RoleUsersResponse> => {
    const params = new URLSearchParams();
    
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.pageSize) params.append('pageSize', pagination.pageSize.toString());

    const response = await apiClient.get<AuthApiResponse<RoleUsersResponse>>(`/auth/roles/${id}/users?${params.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to retrieve users with role');
    }
    
    return response.data.data;
  },

  /**
   * Assign role to multiple users
   * @param roleId - Role ID
   * @param userIds - Array of user IDs
   * @returns Promise<RoleAssignmentResponse>
   */
  assignRoleToUsers: async (roleId: string, userIds: string[]): Promise<RoleAssignmentResponse> => {
    const response = await apiClient.post<AuthApiResponse<RoleAssignmentResponse>>(`/auth/roles/${roleId}/users`, {
      userIds
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Role assignment failed');
    }
    
    return response.data.data;
  },

  /**
   * Remove users from role
   * @param roleId - Role ID
   * @param userIds - Array of user IDs
   * @returns Promise<RoleAssignmentResponse>
   */
  removeUsersFromRole: async (roleId: string, userIds: string[]): Promise<RoleAssignmentResponse> => {
    const response = await apiClient.delete<AuthApiResponse<RoleAssignmentResponse>>(`/auth/roles/${roleId}/users`, {
      data: { userIds }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'User removal from role failed');
    }
    
    return response.data.data;
  },
};