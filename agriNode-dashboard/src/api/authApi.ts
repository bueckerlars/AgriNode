
import axios from 'axios';
import { 
  AuthResponse, 
  User, 
  RegisterRequest, 
  LoginRequest, 
  ChangePasswordRequest 
} from '@/types/api';

const API_BASE_URL = 'http://localhost:5066';

const authApi = {
  /**
   * Registriert einen neuen Benutzer
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/register`, 
      data
    );
    return response.data;
  },

  /**
   * Meldet einen Benutzer an
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/login`, 
      data
    );
    return response.data;
  },

  /**
   * Aktualisiert den Zugriffstoken mit dem Refresh-Token
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/refresh`
    );
    return response.data;
  },

  /**
   * Meldet den Benutzer ab
   */
  logout: async (): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/auth/logout`);
  },

  /**
   * Ruft das Profil des aktuellen Benutzers ab
   */
  getProfile: async (): Promise<User> => {
    const response = await axios.get<User>(
      `${API_BASE_URL}/api/auth/me`
    );
    return response.data;
  },

  /**
   * Ändert das Passwort des Benutzers
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await axios.post(
      `${API_BASE_URL}/api/auth/change-password`, 
      data
    );
  },
};

export default authApi;