import { FindOptions, WhereOptions } from 'sequelize';
import databaseService from '../services/DatabaseService';
import logger from '../config/logger';
import initModels from '../models';
import { User, Sensor, SensorData, ApiKey, SensorSharing, Firmware, CreateFirmwareInput } from '../types';

// Initialize models
const models = initModels(databaseService.getSequelize());

/**
 * DatabaseController provides a simplified interface for database operations
 * across all models in the application
 */
export class DatabaseController {
  // Store model references
  private models = models;

  constructor() {
    databaseService.syncModels();
  }

  /**
   * Generic method to create a record of any model type
   */
  private async create<T>(modelName: string, data: Partial<T>): Promise<T | null> {
    try {
      return await databaseService.create<any>(modelName, data);
    } catch (error) {
      logger.error(`Error in DatabaseController.create: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generic method to find all records of any model type
   */
  private async findAll<T>(modelName: string, options: FindOptions = {}): Promise<T[]> {
    try {
      return await databaseService.findAll<any>(modelName, options);
    } catch (error) {
      logger.error(`Error in DatabaseController.findAll: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generic method to find a record by primary key
   */
  private async findById<T>(modelName: string, id: number | string): Promise<T | null> {
    try {
      return await databaseService.findByPk<any>(modelName, id);
    } catch (error) {
      logger.error(`Error in DatabaseController.findById: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generic method to find a single record matching criteria
   */
  private async findOne<T>(modelName: string, options: FindOptions): Promise<T | null> {
    try {
      return await databaseService.findOne<any>(modelName, options);
    } catch (error) {
      logger.error(`Error in DatabaseController.findOne: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generic method to update records matching criteria
   */
  private async update<T>(modelName: string, data: Partial<T>, where: WhereOptions): Promise<[number, any[]]> {
    try {
      return await databaseService.update(modelName, data, where);
    } catch (error) {
      logger.error(`Error in DatabaseController.update: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generic method to delete records matching criteria
   */
  private async delete(modelName: string, where: WhereOptions): Promise<number> {
    try {
      return await databaseService.destroy(modelName, where);
    } catch (error) {
      logger.error(`Error in DatabaseController.delete: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get a model directly from the database service
   * @param modelName Name of the model to retrieve
   * @returns The requested Sequelize model or null if not found
   */
  public getModelFromService(modelName: string): any {
    try {
      const model = databaseService.getModel(modelName);
      if (!model) {
        logger.warn(`Model ${modelName} not found in database service`);
        return null;
      }
      return model;
    } catch (error) {
      logger.error(`Error in DatabaseController.getModelFromService: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get a model from the local models cache
   * @param modelName Name of the model to retrieve
   * @returns The requested Sequelize model
   */
  public getModel(modelName: keyof typeof this.models): any {
    return this.models[modelName];
  }

  // Type-specific methods for better developer experience

  // User model methods
  public async createUser(data: Partial<User>): Promise<User | null> {
    return this.create<User>('User', data);
  }

  public async findAllUsers(options: FindOptions = {}): Promise<User[]> {
    return this.findAll<User>('User', options);
  }

  public async findUserById(id: string): Promise<User | null> {
    return this.findById<User>('User', id);
  }

  /**
   * Find a user by email
   */
  public async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.findOne<User>('User', { where: { email } });
    } catch (error) {
      logger.error(`Error in DatabaseController.findUserByEmail: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  public async updateUser(data: Partial<User>, where: WhereOptions): Promise<[number, User[]]> {
    return this.update<User>('User', data, where);
  }

  public async deleteUser(where: WhereOptions): Promise<number> {
    return this.delete('User', where);
  }

  /**
   * Update a user's password
   */
  public async updateUserPassword(userId: string, hashedPassword: string): Promise<[number, User[]]> {
    try {
      // Hash the new password before updating
      return this.update<User>('User', { password: hashedPassword }, { where: { id: userId } });
    } catch (error) {
      logger.error(`Error in DatabaseController.updateUserPassword: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Sensor model methods
  public async createSensor(data: Partial<Sensor>): Promise<Sensor | null> {
    return this.create<Sensor>('Sensor', data);
  }

  public async findAllSensors(options: FindOptions = {}): Promise<Sensor[]> {
    return this.findAll<Sensor>('Sensor', options);
  }

  public async findSensorById(id: string): Promise<Sensor | null> {
    return this.findById<Sensor>('Sensor', id);
  }

  public async findSensorByDeviceId(deviceId: string): Promise<Sensor | null> {
    try {
      return await this.findOne<Sensor>('Sensor', { where: { unique_device_id: deviceId } });
    } catch (error) {
      logger.error(`Error in DatabaseController.findSensorByDeviceId: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Find a sensor by a specific criteria
   */
  public async findOneSensor(options: FindOptions): Promise<Sensor | null> {
    try {
      return await this.findOne<Sensor>('Sensor', options);
    } catch (error) {
      logger.error(`Error in DatabaseController.findOneSensor: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  public async updateSensor(data: Partial<Sensor>, where: WhereOptions): Promise<[number, Sensor[]]> {
    return this.update<Sensor>('Sensor', data, where);
  }

  public async deleteSensor(where: WhereOptions): Promise<number> {
    return this.delete('Sensor', where);
  }

  // SensorData model methods
  public async createSensorData(data: Partial<SensorData>): Promise<SensorData | null> {
    return this.create<SensorData>('SensorData', data);
  }

  public async findAllSensorData(options: FindOptions = {}): Promise<SensorData[]> {
    return this.findAll<SensorData>('SensorData', options);
  }

  public async findSensorDataById(id: string): Promise<SensorData | null> {
    return this.findById<SensorData>('SensorData', id);
  }

  public async updateSensorData(data: Partial<SensorData>, where: WhereOptions): Promise<[number, SensorData[]]> {
    return this.update<SensorData>('SensorData', data, where);
  }

  public async deleteSensorData(where: WhereOptions): Promise<number> {
    return this.delete('SensorData', where);
  }

  // ApiKey model methods
  public async createApiKey(data: Partial<ApiKey>): Promise<ApiKey | null> {
    return this.create<ApiKey>('ApiKey', data);
  }

  public async findApiKeysByUser(userId: string): Promise<ApiKey[]> {
    return this.findAll<ApiKey>('ApiKey', { where: { user_id: userId } });
  }

  public async findApiKeyById(id: string): Promise<ApiKey | null> {
    return this.findById<ApiKey>('ApiKey', id);
  }

  public async findApiKeyByKey(key: string): Promise<ApiKey | null> {
    try {
      return await this.findOne<ApiKey>('ApiKey', { where: { key } });
    } catch (error) {
      logger.error(`Error in DatabaseController.findApiKeyByKey: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  public async deleteApiKey(where: WhereOptions): Promise<number> {
    return this.delete('ApiKey', where);
  }

  // SensorSharing model methods
  public async createSensorSharing(data: Partial<SensorSharing>): Promise<SensorSharing | null> {
    return this.create<SensorSharing>('SensorSharing', data);
  }

  public async findAllSensorSharings(options: FindOptions = {}): Promise<SensorSharing[]> {
    return this.findAll<SensorSharing>('SensorSharing', options);
  }

  public async findSensorSharingById(id: string): Promise<SensorSharing | null> {
    return this.findById<SensorSharing>('SensorSharing', id);
  }

  public async findOneSensorSharing(options: FindOptions): Promise<SensorSharing | null> {
    try {
      return await this.findOne<SensorSharing>('SensorSharing', options);
    } catch (error) {
      logger.error(`Error in DatabaseController.findOneSensorSharing: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  public async updateSensorSharing(data: Partial<SensorSharing>, options: { where: WhereOptions }): Promise<SensorSharing | null> {
    try {
      const [affectedCount, affectedRows] = await this.update<SensorSharing>('SensorSharing', data, options.where);
      
      if (affectedCount === 0) {
        logger.warn('No sensor sharing records were updated');
        return null;
      }
      
      // Return the first updated record if it exists
      return affectedRows && affectedRows.length > 0 ? affectedRows[0] : null;
    } catch (error) {
      logger.error(`Error in DatabaseController.updateSensorSharing: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  public async findSensorSharingsByOwner(userId: string): Promise<SensorSharing[]> {
    return this.findAll<SensorSharing>('SensorSharing', { where: { owner_id: userId } });
  }

  public async findSensorSharingsBySharedWith(userId: string): Promise<SensorSharing[]> {
    return this.findAll<SensorSharing>('SensorSharing', { where: { shared_with_id: userId } });
  }

  public async findSensorSharingsBySensor(sensorId: string): Promise<SensorSharing[]> {
    return this.findAll<SensorSharing>('SensorSharing', { where: { sensor_id: sensorId } });
  }

  public async deleteSensorSharing(where: WhereOptions): Promise<number> {
    return this.delete('SensorSharing', where);
  }

  // Firmware methods
  public async createFirmware(data: CreateFirmwareInput): Promise<Firmware | null> {
    return this.create<Firmware>('Firmware', data);
  }

  public async findFirmwareById(firmwareId: string): Promise<Firmware | null> {
    return this.findById<Firmware>('Firmware', firmwareId);
  }

  public async findOneFirmware(options: FindOptions): Promise<Firmware | null> {
    return this.findOne<Firmware>('Firmware', options);
  }

  public async findAllFirmware(): Promise<Firmware[]> {
    return this.findAll<Firmware>('Firmware');
  }

  public async updateFirmware(values: Partial<Firmware>, where: WhereOptions): Promise<[number, Firmware[]]> {
    return this.update<Firmware>('Firmware', values, where);
  }

  public async updateAllFirmware(values: Partial<Firmware>, where: WhereOptions): Promise<[number, Firmware[]]> {
    return this.update<Firmware>('Firmware', values, where);
  }

  public async deleteFirmware(where: WhereOptions): Promise<number> {
    return this.delete('Firmware', where);
  }
}

// Register models with database service
Object.entries(models).forEach(([name, model]) => {
  databaseService.registerModel(name, model);
});

// Create a singleton instance
export const databaseController = new DatabaseController();

export default databaseController;