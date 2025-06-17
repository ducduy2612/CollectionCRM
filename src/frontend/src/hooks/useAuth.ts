import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../services/api/auth.api';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  permissions: string[];
  initials: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
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
        username: response.user.username,
        role: response.user.roles[0] || 'USER',
        permissions: response.user.permissions || [],
        initials: response.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      };
      
      // Store user data in localStorage for faster restoration
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Set user data
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API first while token is still valid
      await authApi.logout();
    } catch (error) {
      // Log the error but continue with local cleanup
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage and user state, regardless of API success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      
      // Clear user data
      setUser(null);
    }
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
      logout().catch(console.error);
      throw error;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const cachedUserData = localStorage.getItem('userData');
        
        if (token) {
          // First, try to use cached user data for immediate UI update
          if (cachedUserData) {
            try {
              const parsedUserData = JSON.parse(cachedUserData) as User;
              setUser(parsedUserData);
              setIsLoading(false); // Set loading to false immediately for better UX
            } catch (parseError) {
              console.error('Failed to parse cached user data:', parseError);
              localStorage.removeItem('userData');
            }
          }
          
          // Then verify token and get fresh user data in the background
          try {
            const userData = await authApi.getCurrentUser();
            // Convert API user data to our User interface if needed
            const userInfo: User = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              username: userData.username,
              role: userData.role,
              permissions: userData.permissions || [],
              initials: userData.initials || userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
              avatar: userData.avatar
            };
            
            // Update cached user data
            localStorage.setItem('userData', JSON.stringify(userInfo));
            setUser(userInfo);
          } catch (apiError) {
            console.error('Auth verification failed:', apiError);
            // Try to refresh token if we have a refresh token
            const refreshTokenValue = localStorage.getItem('refreshToken');
            if (refreshTokenValue) {
              try {
                await refreshToken();
                // Try to get user data again after refresh
                const userData = await authApi.getCurrentUser();
                const userInfo: User = {
                  id: userData.id,
                  name: userData.name,
                  email: userData.email,
                  username: userData.username,
                  role: userData.role,
                  permissions: userData.permissions || [],
                  initials: userData.initials || userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                  avatar: userData.avatar
                };
                localStorage.setItem('userData', JSON.stringify(userInfo));
                setUser(userInfo);
              } catch (refreshError) {
                console.error('Token refresh during initialization failed:', refreshError);
                // Clear all auth data on refresh failure
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userData');
                setUser(null);
              }
            } else {
              // Clear all auth data if no refresh token available
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userData');
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear all auth data on any unexpected error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (user && localStorage.getItem('refreshToken')) {
      // Refresh token every 14 minutes (assuming 15-minute token expiry)
      refreshInterval = setInterval(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
          // If automatic refresh fails, user will be logged out on next API call
        }
      }, 14 * 60 * 1000); // 14 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user]);

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