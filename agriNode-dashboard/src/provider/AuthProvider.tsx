import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, User } from '@/types/api';
import authApi from '@/api/authApi';

// Define AuthContextType
interface AuthContextType {
  authToken?: string | null;
  user?: User | null;
  loading: boolean;
  login: (loginRequest: LoginRequest) => Promise<AuthResponse>;
  register: (registerRequest: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  changePassword: (changePasswordRequest: ChangePasswordRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (loginRequest: LoginRequest) => {
    try {
      const response = await authApi.login(loginRequest);
      setAuthToken(response.accessToken);
      await fetchUser();
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (registerRequest: RegisterRequest) => {
    try {
      const response = await authApi.register(registerRequest);
      setAuthToken(response.accessToken);
      await fetchUser();
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const fetchUser = async () => {
    if (!authToken) return;
    
    try {
      const response = await authApi.getProfile(authToken!);
      setUser(response);
      setLoading(false);
    } catch (error) {
      console.error('Fetching user failed:', error);
      // If token is invalid, try to refresh it once
      try {
        await refreshAccessToken();
        const response = await authApi.getProfile(authToken!);
        setUser(response);
      } catch (refreshError) {
        // If refresh fails, logout the user
        logout();
      }
      setLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await authApi.refreshToken(authToken!);
      setAuthToken(response.accessToken);
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth state if refresh fails
      logout();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear local auth state, even if the API call fails
      setAuthToken(null);
      setUser(null);
    }
  };

  const changePassword = async (changePasswordRequest: ChangePasswordRequest) => {
    if (!authToken) {
      throw new Error('User is not authenticated');
    }

    try {
      await authApi.changePassword(changePasswordRequest);
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Try to get user data if we have a token
    if (authToken) {
      fetchUser();
      
      // Set up token refresh interval
      const refreshInterval = 4.5 * 60 * 1000; // Refresh every 4.5 minutes (slightly before 5min expiry)
      const interval = setInterval(refreshAccessToken, refreshInterval);
      
      return () => clearInterval(interval);
    } else {
      // Try to refresh the token on initial load to recover session
      refreshAccessToken().catch(() => {
        setLoading(false);
      });
    }
  }, [authToken]);

  return (
    <AuthContext.Provider value={{ user, authToken, loading, login, register, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

