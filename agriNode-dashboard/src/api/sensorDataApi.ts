
import axios from 'axios';
import { 
  SensorData, 
  CreateSensorDataRequest, 
  UpdateSensorDataRequest 
} from '@/types/api';

const API_BASE_URL = 'http://localhost:5066';

const sensorDataApi = {
  /**
   * Erstellt neue Sensordaten
   */
  createSensorData: async (data: CreateSensorDataRequest): Promise<SensorData> => {
    const response = await axios.post<SensorData>(
      `${API_BASE_URL}/api/sensor-data`,
      data
    );
    return response.data;
  },

  /**
   * Ruft alle Sensordaten ab
   */
  getAllSensorData: async (): Promise<SensorData[]> => {
    const response = await axios.get<SensorData[]>(
      `${API_BASE_URL}/api/sensor-data`
    );
    return response.data;
  },

  /**
   * Ruft Sensordaten nach ID ab
   */
  getSensorDataById: async (dataId: string): Promise<SensorData> => {
    const response = await axios.get<SensorData>(
      `${API_BASE_URL}/api/sensor-data/${dataId}`
    );
    return response.data;
  },

  /**
   * Aktualisiert Sensordaten
   */
  updateSensorData: async (dataId: string, data: UpdateSensorDataRequest): Promise<SensorData> => {
    const response = await axios.put<SensorData>(
      `${API_BASE_URL}/api/sensor-data/${dataId}`,
      data
    );
    return response.data;
  },

  /**
   * Löscht Sensordaten
   */
  deleteSensorData: async (dataId: string): Promise<void> => {
    await axios.delete(
      `${API_BASE_URL}/api/sensor-data/${dataId}`
    );
  },

  /**
   * Ruft alle Daten für einen bestimmten Sensor ab
   */
  getSensorDataBySensorId: async (sensorId: string): Promise<SensorData[]> => {
    const response = await axios.get<SensorData[]>(
      `${API_BASE_URL}/api/sensor-data/sensor/${sensorId}`
    );
    return response.data;
  },

  /**
   * Löscht alle Daten für einen bestimmten Sensor
   */
  deleteAllSensorDataBySensorId: async (sensorId: string): Promise<{ message: string, count: number }> => {
    const response = await axios.delete<{ message: string, count: number }>(
      `${API_BASE_URL}/api/sensor-data/sensor/${sensorId}`
    );
    return response.data;
  },

  /**
   * Ruft Sensordaten in einem bestimmten Zeitraum ab
   */
  getSensorDataByTimeRange: async (
    sensorId: string, 
    startTime: string, 
    endTime: string
  ): Promise<SensorData[]> => {
    const response = await axios.get<SensorData[]>(
      `${API_BASE_URL}/api/sensor-data/sensor/${sensorId}/timerange`,
      {
        params: {
          startTime,
          endTime
        }
      }
    );
    return response.data;
  }
};

export default sensorDataApi;
