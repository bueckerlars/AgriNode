import { apiClient } from './apiClient';
import { 
  SensorData, 
  CreateSensorDataRequest, 
  UpdateSensorDataRequest 
} from '@/types/api';

const sensorDataApi = {
  /**
   * Erstellt neue Sensordaten
   */
  createSensorData: async (data: CreateSensorDataRequest): Promise<SensorData> => {
    const response = await apiClient.post<SensorData>(
      `/sensor-data`,
      data
    );
    return response.data;
  },

  /**
   * Ruft alle Sensordaten ab
   */
  getAllSensorData: async (): Promise<SensorData[]> => {
    const response = await apiClient.get<SensorData[]>(
      `/sensor-data`
    );
    return response.data;
  },

  /**
   * Ruft Sensordaten nach ID ab
   */
  getSensorDataById: async (dataId: string): Promise<SensorData> => {
    const response = await apiClient.get<SensorData>(
      `/sensor-data/${dataId}`
    );
    return response.data;
  },

  /**
   * Aktualisiert Sensordaten
   */
  updateSensorData: async (dataId: string, data: UpdateSensorDataRequest): Promise<SensorData> => {
    const response = await apiClient.put<SensorData>(
      `/sensor-data/${dataId}`,
      data
    );
    return response.data;
  },

  /**
   * Löscht Sensordaten
   */
  deleteSensorData: async (dataId: string): Promise<void> => {
    await apiClient.delete(
      `/sensor-data/${dataId}`
    );
  },

  /**
   * Ruft alle Daten für einen bestimmten Sensor ab
   */
  getSensorDataBySensorId: async (sensorId: string, signal?: AbortSignal): Promise<SensorData[]> => {
    const response = await apiClient.get<SensorData[]>(
      `/sensor-data/sensor/${sensorId}`,
      {
        signal // Pass the signal to axios
      }
    );
    return response.data;
  },

  /**
   * Löscht alle Daten für einen bestimmten Sensor
   */
  deleteAllSensorDataBySensorId: async (sensorId: string): Promise<{ message: string, count: number }> => {
    const response = await apiClient.delete<{ message: string, count: number }>(
      `/sensor-data/sensor/${sensorId}`
    );
    return response.data;
  },

  /**
   * Ruft Sensordaten in einem bestimmten Zeitraum ab
   */
  getSensorDataByTimeRange: async (
    sensorId: string, 
    startTime: string, 
    endTime: string,
    signal?: AbortSignal
  ): Promise<SensorData[]> => {
    const response = await apiClient.get<SensorData[]>(
      `/sensor-data/sensor/${sensorId}/timerange`,
      {
        params: {
          startTime,
          endTime
        },
        signal // Pass the signal to axios
      }
    );
    return response.data;
  }
};

export default sensorDataApi;
