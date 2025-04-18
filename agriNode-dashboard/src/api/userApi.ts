import { User, UpdateUserRequest } from '@/types/api';
import { apiClient } from './apiClient';

const API_PATH = '/users';

const getAllUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>(API_PATH);
  return response.data;
};

const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get<User>(`${API_PATH}/${userId}`);
  return response.data;
};

const updateUser = async (userId: string, userData: UpdateUserRequest): Promise<User> => {
  const response = await apiClient.put<User>(`${API_PATH}/${userId}`, userData);
  return response.data;
};

const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`${API_PATH}/${userId}`);
};

const toggleRegistration = async (enabled: boolean): Promise<{ registrationEnabled: boolean }> => {
  const response = await apiClient.post<{ registrationEnabled: boolean }>(`${API_PATH}/registration-status`, { enabled });
  return response.data;
};

const getRegistrationStatus = async (): Promise<{ registrationEnabled: boolean }> => {
  const response = await apiClient.get<{ registrationEnabled: boolean }>(`${API_PATH}/registration-status`);
  return response.data;
};

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleRegistration,
  getRegistrationStatus
};