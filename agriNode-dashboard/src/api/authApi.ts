import { 
  AuthResponse, 
  User, 
  RegisterRequest, 
  LoginRequest, 
  ChangePasswordRequest 
} from '@/types/api';
import { apiClient } from './apiClient';

const API_BASE_URL = 'http://localhost:5066';

const authApi = {

  /**
   * Registriert einen neuen Benutzer
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/register`, 
      data
    );
    return response.data;
  },

  /**
   * Meldet einen Benutzer an
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/login`, 
      data
    );
    return response.data;
  },

  /**
   * Aktualisiert den Zugriffstoken mit dem Refresh-Token
   */
  refreshToken: async (authToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/refresh`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    return response.data;
  },

  /**
   * Meldet den Benutzer ab
   */
  logout: async (): Promise<void> => {
    await apiClient.post(`${API_BASE_URL}/api/auth/logout`);
  },

  /**
   * Ruft das Profil des aktuellen Benutzers ab
   */
  getProfile: async (authToken: string): Promise<User> => {
    const response = await apiClient.get<User>(
      `${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    return response.data;
  },

  /**
   * Ändert das Passwort des Benutzers
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post(
      `${API_BASE_URL}/api/auth/change-password`, 
      data
    );
  },
};

export default authApi;