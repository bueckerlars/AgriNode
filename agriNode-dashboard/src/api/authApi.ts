import { apiClient } from './apiClient';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  User
} from '@/types/api';

const authApi = {
  /**
   * Meldet einen Benutzer an
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `/auth/login`,
      data
    );
    return response.data;
  },

  /**
   * Registriert einen neuen Benutzer
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `/auth/register`,
      data
    );
    return response.data;
  },

  /**
   * Aktualisiert das Access-Token
   */
  refreshToken: async (): Promise<AuthResponse> => {
    // Token will be added automatically by the interceptor
    const response = await apiClient.post<AuthResponse>(
      `/auth/refresh`
    );
    return response.data;
  },

  /**
   * Meldet den Benutzer ab
   */
  logout: async (): Promise<void> => {
    await apiClient.post(`/auth/logout`);
  },

  /**
   * Ruft das Profil des aktuellen Benutzers ab
   */
  getProfile: async (): Promise<User> => {
    // Token will be added automatically by the interceptor
    const response = await apiClient.get<User>(
      `/auth/me`
    );
    return response.data;
  },

  /**
   * Ändert das Passwort des Benutzers
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post(
      `/auth/change-password`, 
      data
    );
  },
};

export default authApi;