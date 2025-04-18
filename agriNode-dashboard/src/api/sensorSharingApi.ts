import {apiClient} from './apiClient';
import { Sensor } from '../types/sensor';

export interface SensorSharingResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface SharedUser {
  sharing_id: string;
  user_id: string;
  username: string;
  email: string;
}

const sensorSharingApi = {
  /**
   * Teile einen Sensor mit einem anderen Benutzer
   */
  async shareSensor(sensorId: string, userId: string): Promise<SensorSharingResponse> {
    try {
      const response = await apiClient.post(`/sharing/${sensorId}`, { userId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Fehler beim Teilen des Sensors');
    }
  },

  /**
   * Beende die Freigabe eines Sensors für einen Benutzer
   */
  async unshareSensor(sensorId: string, sharedUserId: string): Promise<SensorSharingResponse> {
    try {
      const response = await apiClient.delete(`/sharing/${sensorId}/${sharedUserId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Fehler beim Aufheben der Freigabe');
    }
  },

  /**
   * Entferne alle Freigaben für einen Sensor
   */
  async removeAllSharings(sensorId: string): Promise<SensorSharingResponse> {
    try {
      const response = await apiClient.delete(`/sharing/${sensorId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Fehler beim Entfernen aller Freigaben');
    }
  },

  /**
   * Hole alle Sensoren, die mit dem aktuellen Benutzer geteilt wurden
   */
  async getSharedWithMe(): Promise<Sensor[]> {
    try {
      const response = await apiClient.get('/sharing/shared-with-me');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Fehler beim Abrufen geteilter Sensoren');
    }
  },

  /**
   * Hole alle Benutzer, mit denen ein Sensor geteilt wurde
   */
  async getSharedUsers(sensorId: string): Promise<SharedUser[]> {
    try {
      const response = await apiClient.get(`/sharing/${sensorId}/users`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Fehler beim Abrufen der Benutzer');
    }
  }
};

export default sensorSharingApi;