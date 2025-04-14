import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, User } from '@/types/api';
import authApi from '@/api/authApi';

// Define AuthContextType
interface AuthContextType {
  authToken?: string | null;
  user?: User | null;
  loading: boolean;
  login: (loginRequest: LoginRequest) => Promise<string>;
  register: (registerRequest: RegisterRequest) => Promise<string>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  refreshAccessToken: () => Promise<AuthResponse>;
  changePassword: (changePasswordRequest: ChangePasswordRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        await refreshAccessToken();
        await fetchUser();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (loginRequest: LoginRequest) => {
    try {
      setLoading(true);
      const response = await authApi.login(loginRequest);
      setAuthToken(response.accessToken);
      await fetchUser();
      return response.accessToken;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerRequest: RegisterRequest) => {
    try {
      setLoading(true);
      const response = await authApi.register(registerRequest);
      setAuthToken(response.accessToken);
      await fetchUser();
      return response.accessToken;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await authApi.getProfile();
      setUser(response);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser(null);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await authApi.refreshToken();
      setAuthToken(response.accessToken);
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setAuthToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const changePassword = async (changePasswordRequest: ChangePasswordRequest) => {
    try {
      setLoading(true);
      await authApi.changePassword(changePasswordRequest);
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authToken, loading, login, register, logout, changePassword, fetchUser, refreshAccessToken }}>
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

