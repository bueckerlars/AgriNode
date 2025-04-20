import { apiClient } from './apiClient';
import { ApiResponse, ApiKey, CreateApiKeyRequest } from '@/types/api';

const apiKeyApi = {
  getApiKeys: async (): Promise<ApiKey[]> => {
    const response = await apiClient.get<ApiResponse<ApiKey[]>>(
      `/api-keys`
    );
    return response.data.data || [];
  },

  createApiKey: async (name: string, expiresIn?: number): Promise<ApiKey> => {
    const response = await apiClient.post<ApiResponse<ApiKey>>(
      `/api-keys`,
      { name, expiresIn }
    );
    return response.data.data as ApiKey;
  },

  deleteApiKey: async (id: string): Promise<void> => {
    await apiClient.delete(
      `/api-keys/${id}`
    );
  }
};

export default apiKeyApi;