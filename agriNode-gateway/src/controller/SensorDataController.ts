import { Request, Response } from 'express';
import SensorDataService from '../services/SensorDataService';
import logger from '../config/logger';
import { SensorData } from '../types';

class SensorDataController {
  /**
   * Create new sensor data
   */
  async createSensorData(req: Request, res: Response): Promise<void> {
    try {
      const sensorData: SensorData = req.body;
      
      // Ensure the sensor belongs to the authenticated user
      const sensorId = sensorData.sensor_id;
      
      // Set timestamp if not provided
      if (!sensorData.timestamp) {
        sensorData.timestamp = new Date();
      }
      
      const createdData = await SensorDataService.createSensorData(sensorData);
      res.status(201).json(createdData);
    } catch (error) {
      logger.error(`Error in createSensorData: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Failed to create sensor data', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get all sensor data (admin or filtered by user)
   */
  async getAllSensorData(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';
      
      // If admin, get all data, otherwise filter by user's sensors
      const sensorData = await SensorDataService.getAllSensorData();
      
      res.status(200).json(sensorData);
    } catch (error) {
      logger.error(`Error in getAllSensorData: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Failed to fetch sensor data', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get sensor data by ID
   */
  async getSensorDataById(req: Request, res: Response): Promise<void> {
    try {
      const dataId = req.params.id;
      const sensorData = await SensorDataService.getSensorDataById(dataId);
      
      if (!sensorData) {
        res.status(404).json({ message: 'Sensor data not found' });
        return;
      }
      
      res.status(200).json(sensorData);
    } catch (error) {
      logger.error(`Error in getSensorDataById: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Failed to fetch sensor data', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get data for a specific sensor
   */
  async getSensorDataBySensorId(req: Request, res: Response): Promise<void> {
    try {
      const sensorId = req.params.sensorId;
      const sensorData = await SensorDataService.getSensorDataBySensorId(sensorId);
      
      res.status(200).json(sensorData);
    } catch (error) {
      logger.error(`Error in getSensorDataBySensorId: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Failed to fetch sensor data', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get sensor data by time range
   */
  async getSensorDataByTimeRange(req: Request, res: Response): Promise<void> {
    try {
      const sensorId = req.params.sensorId;
      const { startTime, endTime } = req.query;
      
      if (!startTime || !endTime) {
        res.status(400).json({ message: 'Start time and end time are required' });
        return;
      }
      
      const startDate = new Date(startTime as string);
      const endDate = new Date(endTime as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({ message: 'Invalid date format' });
        return;
      }
      
      const sensorData = await SensorDataService.getSensorDataByTimeRange(sensorId, startDate, endDate);
      
      res.status(200).json(sensorData);
    } catch (error) {
      logger.error(`Error in getSensorDataByTimeRange: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Failed to fetch sensor data', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Update sensor data
   */
  async updateSensorData(req: Request, res: Response): Promise<void> {
    try {
      const dataId = req.params.id;
      const updateData = req.body;
      
      // Prevent updating the sensor_id
      if (updateData.sensor_id) {
        delete updateData.sensor_id;
      }
      
      const [updatedCount] = await SensorDataService.updateSensorData(dataId, updateData);
      
      if (updatedCount === 0) {
        res.status(404).json({ message: 'Sensor data not found or not updated' });
        return;
      }
      
      const updatedData = await SensorDataService.getSensorDataById(dataId);
      res.status(200).json(updatedData);
    } catch (error) {
      logger.error(`Error in updateSensorData: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Failed to update sensor data', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Delete sensor data
   */
  async deleteSensorData(req: Request, res: Response): Promise<void> {
    try {
      const dataId = req.params.id;
      const deletedCount = await SensorDataService.deleteSensorData(dataId);
      
      if (deletedCount === 0) {
        res.status(404).json({ message: 'Sensor data not found or not deleted' });
        return;
      }
      
      res.status(200).json({ message: 'Sensor data deleted successfully' });
    } catch (error) {
      logger.error(`Error in deleteSensorData: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Failed to delete sensor data', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Delete all data for a specific sensor
   */
  async deleteAllSensorData(req: Request, res: Response): Promise<void> {
    try {
      const sensorId = req.params.sensorId;
      const deletedCount = await SensorDataService.deleteAllSensorData(sensorId);
      
      res.status(200).json({ 
        message: 'Sensor data deleted successfully', 
        count: deletedCount 
      });
    } catch (error) {
      logger.error(`Error in deleteAllSensorData: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Failed to delete sensor data', error: error instanceof Error ? error.message : String(error) });
    }
  }
}

export default new SensorDataController();