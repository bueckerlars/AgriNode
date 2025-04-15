import { apiClient } from './apiClient';
import { 
  ApiResponse, 
  Sensor, 
  RegisterSensorRequest, 
  UpdateSensorRequest 
} from '@/types/api';

const sensorApi = {
  /**
   * Ruft alle Sensoren des angemeldeten Benutzers ab
   */
  getAllSensors: async (): Promise<Sensor[]> => {
    const response = await apiClient.get<ApiResponse<Sensor[]>>(
      `/sensors`
    );
    return response.data.data || [];
  },

  /**
   * Registriert einen neuen Sensor
   */
  registerSensor: async (data: RegisterSensorRequest): Promise<Sensor> => {
    const response = await apiClient.post<ApiResponse<Sensor>>(
      `/sensors/register`,
      data
    );
    return response.data.data as Sensor;
  },

  /**
   * Ruft einen bestimmten Sensor nach ID ab
   */
  getSensorById: async (sensorId: string): Promise<Sensor> => {
    const response = await apiClient.get<ApiResponse<Sensor>>(
      `/sensors/${sensorId}`
    );
    return response.data.data as Sensor;
  },

  /**
   * Aktualisiert einen Sensor
   */
  updateSensor: async (sensorId: string, data: UpdateSensorRequest): Promise<Sensor> => {
    const response = await apiClient.put<ApiResponse<Sensor>>(
      `/sensors/${sensorId}`,
      data
    );
    return response.data.data as Sensor;
  },

  /**
   * Löscht einen Sensor
   */
  deleteSensor: async (sensorId: string): Promise<void> => {
    await apiClient.delete(
      `/sensors/${sensorId}`
    );
  }
};

export default sensorApi;
