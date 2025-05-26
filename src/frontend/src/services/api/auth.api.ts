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
};