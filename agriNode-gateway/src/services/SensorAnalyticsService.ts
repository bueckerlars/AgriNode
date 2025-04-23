import databaseController from '../controller/DatabaseController';
import logger from '../config/logger';
import { AnalysisStatus, AnalysisType, SensorAnalytics } from '../types/SensorAnalytics';
import { FindOptions, WhereOptions } from 'sequelize';

export class SensorAnalyticsService {
  /**
   * Create a new sensor analytics entry
   */
  public async createAnalytics(userId: string, sensorId: string, type: AnalysisType, parameters: any): Promise<SensorAnalytics | null> {
    try {
      if (!userId) {
        logger.error("createAnalytics: userId is undefined or empty");
        return null;
      }
      
      if (!sensorId) {
        logger.error("createAnalytics: sensorId is undefined or empty");
        return null;
      }
      
      logger.debug(`createAnalytics: attempting to create analysis for user ${userId} and sensor ${sensorId}`);
      
      // Validate that the sensor exists and belongs to the user
      const sensor = await databaseController.findSensorById(sensorId);
      if (!sensor) {
        logger.warn(`Cannot create analytics: Sensor ${sensorId} not found`);
        return null;
      }

      logger.debug(`Sensor found: ${JSON.stringify({
        id: sensor.sensor_id,
        user_id: sensor.user_id,
        current_user: userId
      })}`);

      // Check if user owns the sensor
      if (sensor.user_id === userId) {
        logger.debug(`User ${userId} owns sensor ${sensorId}, proceeding with analytics creation`);
      } else {
        // User doesn't own the sensor, check if it's shared with them
        logger.debug(`User ${userId} is not the owner of sensor ${sensorId}, checking sharing permissions`);
        
        try {
          // Direct query to check if sharing exists
          const sharingModel = databaseController.getModelFromService('SensorSharing');
          if (!sharingModel) {
            logger.error('SensorSharing model not found');
            return null;
          }
          
          const sharing = await sharingModel.findOne({
            where: {
              sensor_id: sensorId,
              shared_with_id: userId,
              status: 'accepted'
            }
          });
          
          if (!sharing) {
            logger.warn(`User ${userId} does not have access to sensor ${sensorId} - no sharing record found`);
            return null;
          }
          
          logger.debug(`Found sharing record, user ${userId} has access to sensor ${sensorId}`);
        } catch (error) {
          logger.error(`Error checking sensor sharing: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      }

      logger.debug(`Creating analytics entry with status ${AnalysisStatus.PENDING}`);
      
      // Create the analytics entry in pending state
      return await databaseController.createSensorAnalytics({
        sensor_id: sensorId,
        user_id: userId,
        status: AnalysisStatus.PENDING,
        type,
        parameters,
      });
    } catch (error) {
      logger.error(`Error in SensorAnalyticsService.createAnalytics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get analytics by ID
   */
  public async getAnalyticsById(analyticsId: string): Promise<SensorAnalytics | null> {
    try {
      return await databaseController.findSensorAnalyticsById(analyticsId);
    } catch (error) {
      logger.error(`Error in SensorAnalyticsService.getAnalyticsById: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all analytics for a user
   */
  public async getAnalyticsByUser(userId: string, options: FindOptions = {}): Promise<SensorAnalytics[]> {
    try {
      const findOptions: FindOptions = {
        ...options,
        where: {
          ...(options.where || {}),
          user_id: userId,
        },
      };
      return await databaseController.findAllSensorAnalytics(findOptions);
    } catch (error) {
      logger.error(`Error in SensorAnalyticsService.getAnalyticsByUser: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all analytics for a sensor
   */
  public async getAnalyticsBySensor(sensorId: string, options: FindOptions = {}): Promise<SensorAnalytics[]> {
    try {
      const findOptions: FindOptions = {
        ...options,
        where: {
          ...(options.where || {}),
          sensor_id: sensorId,
        },
      };
      return await databaseController.findAllSensorAnalytics(findOptions);
    } catch (error) {
      logger.error(`Error in SensorAnalyticsService.getAnalyticsBySensor: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update analytics status and result
   */
  public async updateAnalytics(analyticsId: string, data: Partial<SensorAnalytics>): Promise<[number, SensorAnalytics[]]> {
    try {
      return await databaseController.updateSensorAnalytics(data, { analytics_id: analyticsId });
    } catch (error) {
      logger.error(`Error in SensorAnalyticsService.updateAnalytics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete analytics by ID
   */
  public async deleteAnalytics(analyticsId: string): Promise<number> {
    try {
      return await databaseController.deleteSensorAnalytics({ analytics_id: analyticsId });
    } catch (error) {
      logger.error(`Error in SensorAnalyticsService.deleteAnalytics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

// Create and export a singleton instance
const sensorAnalyticsService = new SensorAnalyticsService();
export default sensorAnalyticsService;