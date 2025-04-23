import { apiClient } from './apiClient';
import { ApiResponse, SensorAnalytics, CreateAnalyticsRequest, AnalysisType } from '../types/api';

const baseUrl = '/analytics';

export const analyticsApi = {
  // Get all analytics entries for the current user
  getUserAnalytics: async (): Promise<SensorAnalytics[]> => {
    const response = await apiClient.get<ApiResponse<SensorAnalytics[]>>(baseUrl);
    return response.data.data || [];
  },

  // Get analytics entries for a specific sensor
  getSensorAnalytics: async (sensorId: string): Promise<SensorAnalytics[]> => {
    const response = await apiClient.get<ApiResponse<SensorAnalytics[]>>(`${baseUrl}/sensor/${sensorId}`);
    return response.data.data || [];
  },

  // Get an analytics entry by ID
  getAnalyticsById: async (analyticsId: string): Promise<SensorAnalytics | null> => {
    try {
      const response = await apiClient.get<ApiResponse<SensorAnalytics>>(`${baseUrl}/${analyticsId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  },

  // Create a new analytics entry
  createAnalytics: async (request: CreateAnalyticsRequest): Promise<SensorAnalytics | null> => {
    try {
      const response = await apiClient.post<ApiResponse<SensorAnalytics>>(baseUrl, request);
      return response.data.data || null;
    } catch (error) {
      console.error('Error creating analytics:', error);
      return null;
    }
  },

  // Delete an analytics entry
  deleteAnalytics: async (analyticsId: string): Promise<boolean> => {
    try {
      await apiClient.delete<ApiResponse<void>>(`${baseUrl}/${analyticsId}`);
      return true;
    } catch (error) {
      console.error('Error deleting analytics:', error);
      return false;
    }
  }
};