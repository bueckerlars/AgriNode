import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, User } from '@/types/api';
import authApi from '@/api/authApi';
import { setAuthTokenForApi } from '@/api/apiClient';

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
  // Token wird nur im State gespeichert, nicht im localStorage
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Aktualisiert den authToken im State und im API-Client
  const updateAuthToken = (token: string | null) => {
    setAuthToken(token);
    setAuthTokenForApi(token);
  };

  const fetchUser = async (token?: string | null) => {
    // Verwende den übergebenen Token oder den aus dem State
    const currentToken = token || authToken;
    if (!currentToken) return null;
    
    try {
      // Der API-Client verwendet den Token, der mit setAuthTokenForApi gesetzt wurde
      const response = await authApi.getProfile();
      setUser(response);
      setLoading(false);
      return response;
    } catch (error) {
      console.error('Fetching user failed:', error);
      setLoading(false);
      return null;
    }
  };

  const login = async (loginRequest: LoginRequest) => {
    try {
      const response = await authApi.login(loginRequest);
      const token = response.accessToken;
      
      // Token sofort für API-Client setzen (ohne auf State-Update zu warten)
      setAuthTokenForApi(token);
      
      // Benutzerdaten holen mit dem neuen Token
      try {
        const userData = await authApi.getProfile();
        
        // Erst jetzt State aktualisieren, wenn alles erfolgreich war
        updateAuthToken(token);
        setUser(userData);
        setLoading(false);
        
        return response;
      } catch (userError) {
        console.error('Error fetching user after login:', userError);
        // Trotzdem Token setzen, da Login erfolgreich war
        updateAuthToken(token);
        throw new Error('Login erfolgreich, aber Benutzerdaten konnten nicht abgerufen werden');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (registerRequest: RegisterRequest) => {
    try {
      const response = await authApi.register(registerRequest);
      const token = response.accessToken;
      
      // Ähnlicher Ansatz wie bei login
      setAuthTokenForApi(token);
      
      try {
        const userData = await authApi.getProfile();
        updateAuthToken(token);
        setUser(userData);
        setLoading(false);
        return response;
      } catch (userError) {
        console.error('Error fetching user after registration:', userError);
        updateAuthToken(token);
        throw new Error('Registrierung erfolgreich, aber Benutzerdaten konnten nicht abgerufen werden');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await authApi.refreshToken();
      const token = response.accessToken;
      
      updateAuthToken(token);
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
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
      updateAuthToken(null);
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

  // Initialisierung - Versuchen, den User-Status beim ersten Laden zu bekommen und Token zu refreshen
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Versuchen, den Token zu refreshen
        const response = await authApi.refreshToken();
        const token = response.accessToken;
        
        // Token setzen und dann Benutzerdaten abrufen
        setAuthTokenForApi(token);
        const userData = await authApi.getProfile();
        
        // State aktualisieren
        updateAuthToken(token);
        setUser(userData);
        setLoading(false);
      } catch (error) {
        // Wenn das Refreshen fehlschlägt, User ist nicht eingeloggt, das ist ok
        console.log('Not authenticated, refresh token failed');
        setLoading(false);
      }
    };

    initAuth();

    // Token-Refresh-Intervall einrichten
    const refreshInterval = 4 * 60 * 1000; // Refresh alle 4 Minuten (vor 5 Min. Ablauf)
    const interval = setInterval(refreshAccessToken, refreshInterval);
    
    return () => clearInterval(interval);
  }, []);

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

