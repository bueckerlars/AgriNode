import { apiClient } from './apiClient';
import type { Firmware } from '../types/firmware';

export const firmwareApi = {
  getAllFirmware: async (): Promise<Firmware[]> => {
    const response = await apiClient.get('/firmware');
    return response.data.data;
  },

  uploadFirmware: async (formData: FormData): Promise<Firmware> => {
    const response = await apiClient.post('/firmware', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  setActiveFirmware: async (firmwareId: string): Promise<Firmware> => {
    const response = await apiClient.post(`/firmware/${firmwareId}/activate`);
    return response.data.data;
  },

  deleteFirmware: async (firmwareId: string): Promise<void> => {
    await apiClient.delete(`/firmware/${firmwareId}`);
  }
};