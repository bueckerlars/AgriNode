import { FindOptions, WhereOptions } from 'sequelize';
import databaseController from '../controller/DatabaseController';
import logger from '../config/logger';
import { SensorData } from '../types';

class SensorDataService {
  /**
   * Create new sensor data record
   */
  async createSensorData(sensorData: Partial<SensorData>): Promise<SensorData | null> {
    try {
      logger.info('Creating new sensor data record' + JSON.stringify(sensorData));

      const sensor = await databaseController.findSensorByDeviceId(sensorData.sensor_id!);
      sensorData.sensor_id = sensor?.sensor_id;
      return await databaseController.createSensorData(sensorData);
    } catch (error) {
      logger.error(`Error creating sensor data: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all sensor data with optional filtering
   */
  async getAllSensorData(options: FindOptions = {}): Promise<SensorData[]> {
    try {
      return await databaseController.findAllSensorData(options);
    } catch (error) {
      logger.error(`Error fetching all sensor data: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get sensor data by ID
   */
  async getSensorDataById(dataId: string): Promise<SensorData | null> {
    try {
      return await databaseController.findSensorDataById(dataId);
    } catch (error) {
      logger.error(`Error fetching sensor data by ID: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get sensor data for a specific sensor
   */
  async getSensorDataBySensorId(sensorId: string): Promise<SensorData[]> {
    try {
      return await databaseController.findAllSensorData({
        where: { sensor_id: sensorId },
        order: [['timestamp', 'DESC']]
      });
    } catch (error) {
      logger.error(`Error fetching sensor data by sensor ID: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get sensor data within a time range
   */
  async getSensorDataByTimeRange(sensorId: string, startTime: Date, endTime: Date): Promise<SensorData[]> {
    try {
      return await databaseController.findAllSensorData({
        where: {
          sensor_id: sensorId,
          timestamp: {
            [Symbol.for('gte')]: startTime,
            [Symbol.for('lte')]: endTime
          }
        },
        order: [['timestamp', 'ASC']]
      });
    } catch (error) {
      logger.error(`Error fetching sensor data by time range: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update sensor data
   */
  async updateSensorData(dataId: string, updateData: Partial<SensorData>): Promise<[number, SensorData[]]> {
    try {
      return await databaseController.updateSensorData(updateData, { where: { data_id: dataId } });
    } catch (error) {
      logger.error(`Error updating sensor data: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete sensor data
   */
  async deleteSensorData(dataId: string): Promise<number> {
    try {
      return await databaseController.deleteSensorData({ where: { data_id: dataId } });
    } catch (error) {
      logger.error(`Error deleting sensor data: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete all data for a specific sensor
   */
  async deleteAllSensorData(sensorId: string): Promise<number> {
    try {
      return await databaseController.deleteSensorData({ where: { sensor_id: sensorId } });
    } catch (error) {
      logger.error(`Error deleting all sensor data for sensor: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

export default new SensorDataService();