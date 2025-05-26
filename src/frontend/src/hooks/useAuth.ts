import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../services/api/auth.api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = async (username: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ username, password });
      
      // Store tokens
      localStorage.setItem('accessToken', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Convert API user data to our User interface
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.roles[0] || 'USER',
        initials: response.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      };
      
      // Set user data
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear user data
    setUser(null);
    
    // Call logout API
    authApi.logout().catch(console.error);
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken(refreshToken);
      
      // Update tokens
      localStorage.setItem('accessToken', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Verify token and get user data
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
  };
};

export { AuthContext };