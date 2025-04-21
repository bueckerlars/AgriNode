import { FindOptions, WhereOptions } from 'sequelize';
import databaseController from '../controller/DatabaseController';
import logger from '../config/logger';
import { SensorData } from '../types';
import sensorService from './SensorService';

class SensorDataService {
  /**
   * Create new sensor data record and update sensor status
   */
  async createSensorData(sensorData: Partial<SensorData>): Promise<SensorData | null> {
    try {
      logger.info('Creating new sensor data record: ' + JSON.stringify(sensorData));

      // Get the device ID from the incoming data
      const deviceId = sensorData.sensor_id;
      
      if (!deviceId) {
        throw new Error('Device ID is required');
      }

      // Find the sensor using the device ID
      const sensor = await databaseController.findSensorByDeviceId(deviceId);
      
      if (!sensor) {
        throw new Error(`Sensor with device ID ${deviceId} not found`);
      }
      
      // Replace the device ID with the actual sensor ID from database
      sensorData.sensor_id = sensor.sensor_id;
      
      const newSensorData = await databaseController.createSensorData(sensorData);
      
      // Update the sensor's lastUpdated and batteryLevel if available
      if (newSensorData) {
        await sensorService.updateSensorStatus(
          sensor.sensor_id, 
          sensorData.battery_level // Pass battery level if available
        );
      }
      
      return newSensorData;
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
      const result = await databaseController.deleteSensorData({
        where: { sensor_id: sensorId }
      });
      logger.info(`Deleted ${result} records for sensor ${sensorId}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting all sensor data for sensor: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

export default new SensorDataService();