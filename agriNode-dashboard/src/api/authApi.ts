import { apiClient } from './apiClient';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  User
} from '@/types/api';

const API_BASE_URL = 'http://localhost:5066';

const authApi = {
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
   * Aktualisiert das Access-Token
   */
  refreshToken: async (authToken: string): Promise<AuthResponse> => {
    // Token will be added automatically by the interceptor
    const response = await apiClient.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/refresh`
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
    // Token will be added automatically by the interceptor
    const response = await apiClient.get<User>(
      `${API_BASE_URL}/api/auth/me`
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