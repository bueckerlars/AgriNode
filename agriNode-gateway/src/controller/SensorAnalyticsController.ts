import { Request, Response } from 'express';
import sensorAnalyticsService from '../services/SensorAnalyticsService';
import analyticsProcessorService from '../services/AnalyticsProcessorService';
import logger from '../config/logger';
import { AnalysisType } from '../types/SensorAnalytics';

class SensorAnalyticsController {
  /**
   * Create a new analytics entry
   */
  public createAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check authentication
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // Validate request body
      const { sensor_id, type, parameters } = req.body;
      
      if (!sensor_id || !type || !parameters) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      if (!Object.values(AnalysisType).includes(type)) {
        res.status(400).json({ success: false, message: 'Invalid analysis type' });
        return;
      }

      if (!parameters.timeRange || !parameters.timeRange.start || !parameters.timeRange.end) {
        res.status(400).json({ success: false, message: 'Time range is required in parameters' });
        return;
      }

      const userId = req.user.id;
      
      if (!userId) {
        logger.error('User ID is missing in the authentication token');
        res.status(401).json({ success: false, message: 'Invalid authentication token' });
        return;
      }

      // Create analytics entry
      const analytics = await sensorAnalyticsService.createAnalytics(
        userId,
        sensor_id,
        type,
        parameters
      );

      if (!analytics) {
        res.status(404).json({ success: false, message: 'Sensor not found or access denied' });
        return;
      }

      // Trigger automatic processing of the new analytics
      analyticsProcessorService.queueAnalyticsForProcessing(analytics.analytics_id);
      
      res.status(201).json({ success: true, data: analytics });
    } catch (error) {
      logger.error(`Error in SensorAnalyticsController.createAnalytics: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  /**
   * Get all analytics for current user
   */
  public getUserAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check authentication
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userId = req.user.id;
      
      if (!userId) {
        logger.error('User ID is missing in the authentication token');
        res.status(401).json({ success: false, message: 'Invalid authentication token' });
        return;
      }

      const analytics = await sensorAnalyticsService.getAnalyticsByUser(userId);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      logger.error(`Error in SensorAnalyticsController.getUserAnalytics: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  /**
   * Get analytics by ID
   */
  public getAnalyticsById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check authentication
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { analytics_id } = req.params;
      const analytics = await sensorAnalyticsService.getAnalyticsById(analytics_id);

      if (!analytics) {
        res.status(404).json({ success: false, message: 'Analytics not found' });
        return;
      }

      // Check if user has access to this analytics entry
      if (analytics.user_id !== req.user.id) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      logger.error(`Error in SensorAnalyticsController.getAnalyticsById: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  /**
   * Get analytics for a specific sensor
   */
  public getSensorAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check authentication
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { sensor_id } = req.params;
      const analytics = await sensorAnalyticsService.getAnalyticsBySensor(sensor_id);

      // Filter to only include analytics entries created by the current user
      const userAnalytics = analytics.filter(entry => entry.user_id === req.user.id);

      res.status(200).json({ success: true, data: userAnalytics });
    } catch (error) {
      logger.error(`Error in SensorAnalyticsController.getSensorAnalytics: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  /**
   * Delete an analytics entry
   */
  public deleteAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check authentication
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { analytics_id } = req.params;
      
      // First, check if analytics exists and belongs to the user
      const analytics = await sensorAnalyticsService.getAnalyticsById(analytics_id);
      if (!analytics) {
        res.status(404).json({ success: false, message: 'Analytics not found' });
        return;
      }

      if (analytics.user_id !== req.user.id) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Delete the analytics entry
      await sensorAnalyticsService.deleteAnalytics(analytics_id);
      res.status(200).json({ success: true, message: 'Analytics deleted successfully' });
    } catch (error) {
      logger.error(`Error in SensorAnalyticsController.deleteAnalytics: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
}

export default new SensorAnalyticsController();