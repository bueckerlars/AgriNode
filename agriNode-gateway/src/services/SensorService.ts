import { v4 as uuidv4 } from 'uuid';
import { Sensor } from '../types/Sensor';
import databaseController from '../controller/DatabaseController';
import logger from '../config/logger';

class SensorService {
    /**
     * Register a new sensor for a user
     */
    async registerSensor(userId: string, sensorData: Partial<Sensor>): Promise<Sensor> {
        try {
            logger.info(`Registering new sensor for user: ${userId}`);
            
            // Check if sensor with this device ID already exists
            const existingSensor = await databaseController.findOneSensor({
                where: { unique_device_id: sensorData.unique_device_id }
            });
            
            if (existingSensor) {
                logger.warn(`Sensor with device ID ${sensorData.unique_device_id} already exists`);
                throw new Error('Sensor with this device ID already exists');
            }
            
            // Create new sensor with generated ID
            const newSensor = await databaseController.createSensor({
                sensor_id: uuidv4(),
                user_id: userId,
                name: sensorData.name || 'Unnamed Sensor',
                type: sensorData.type || 'generic',
                location: sensorData.location,
                unique_device_id: sensorData.unique_device_id,
                batteryLevel: sensorData.batteryLevel || 100,
                registered_at: new Date(),
                updated_at: new Date()
            });
            
            if (!newSensor) {
                throw new Error('Failed to register sensor');
            }
            
            logger.info(`Sensor registered successfully with ID: ${newSensor.sensor_id}`);
            return newSensor;
        } catch (error) {
            logger.error(`Error in SensorService.registerSensor: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    
    /**
     * Unregister (delete) a sensor
     */
    async unregisterSensor(sensorId: string, userId: string): Promise<boolean> {
        try {
            logger.info(`Unregistering sensor ID: ${sensorId} for user: ${userId}`);
            
            // Verify the sensor belongs to the user before deletion
            const sensor = await databaseController.findSensorById(sensorId);
            
            if (!sensor) {
                logger.warn(`Sensor with ID ${sensorId} not found`);
                throw new Error('Sensor not found');
            }
            
            if (sensor.user_id !== userId) {
                logger.warn(`Unauthorized attempt to unregister sensor ${sensorId} by user ${userId}`);
                throw new Error('You do not have permission to unregister this sensor');
            }
            
            // Delete the sensor
            const result = await databaseController.deleteSensor({ 
                where: { sensor_id: sensorId } 
            });
            
            logger.info(`Sensor ${sensorId} unregistered successfully`);
            return result > 0;
        } catch (error) {
            logger.error(`Error in SensorService.unregisterSensor: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    
    /**
     * Get sensor information by ID
     */
    async getSensorById(sensorId: string, userId: string): Promise<Sensor> {
        try {
            logger.info(`Getting info for sensor ID: ${sensorId}`);
            
            const sensor = await databaseController.findSensorById(sensorId);
            
            if (!sensor) {
                logger.warn(`Sensor with ID ${sensorId} not found`);
                throw new Error('Sensor not found');
            }
            
            // Verify the user has access to this sensor
            if (sensor.user_id !== userId) {
                logger.warn(`Unauthorized attempt to access sensor ${sensorId} by user ${userId}`);
                throw new Error('You do not have permission to access this sensor');
            }
            
            return sensor;
        } catch (error) {
            logger.error(`Error in SensorService.getSensorById: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    
    /**
     * Get all sensors for a specific user
     */
    async getSensorsByUserId(userId: string): Promise<Sensor[]> {
        try {
            logger.info(`Getting all sensors for user: ${userId}`);
            
            const sensors = await databaseController.findAllSensors({
                where: { user_id: userId }
            });
            
            logger.info(`Found ${sensors.length} sensors for user ${userId}`);
            return sensors;
        } catch (error) {
            logger.error(`Error in SensorService.getSensorsByUserId: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    
    /**
     * Update sensor information
     */
    async updateSensor(sensorId: string, userId: string, updateData: Partial<Sensor>): Promise<Sensor> {
        try {
            logger.info(`Updating sensor ID: ${sensorId}`);
            
            // Verify sensor exists and belongs to user
            const sensor = await databaseController.findSensorById(sensorId);
            
            if (!sensor) {
                logger.warn(`Sensor with ID ${sensorId} not found`);
                throw new Error('Sensor not found');
            }
            
            if (sensor.user_id !== userId) {
                logger.warn(`Unauthorized attempt to update sensor ${sensorId} by user ${userId}`);
                throw new Error('You do not have permission to update this sensor');
            }
            
            // Remove fields that shouldn't be updated
            const sanitizedUpdate = { ...updateData };
            delete sanitizedUpdate.sensor_id;
            delete sanitizedUpdate.user_id;
            delete sanitizedUpdate.unique_device_id;
            delete sanitizedUpdate.registered_at;
            
            // Add updated timestamp
            sanitizedUpdate.updated_at = new Date();
            
            // Update the sensor
            await databaseController.updateSensor(
                sanitizedUpdate, 
                { where: { sensor_id: sensorId } }
            );
            
            // Get the updated sensor
            const updatedSensor = await databaseController.findSensorById(sensorId);
            
            if (!updatedSensor) {
                throw new Error('Failed to retrieve updated sensor');
            }
            
            logger.info(`Sensor ${sensorId} updated successfully`);
            return updatedSensor;
        } catch (error) {
            logger.error(`Error in SensorService.updateSensor: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Update sensor battery level and last updated timestamp
     */
    async updateSensorStatus(sensorId: string, batteryLevel?: number): Promise<Sensor | null> {
        try {
            logger.info(`Updating sensor status for ID: ${sensorId}`);
            
            const updateData: Partial<Sensor> = {
                updated_at: new Date(),
            };
            
            // Only update battery level if provided
            if (batteryLevel !== undefined) {
                updateData.batteryLevel = batteryLevel;
            }

            logger.info(`Updating sensor ${sensorId} with data: ${JSON.stringify(updateData)}`);
            
            // Fix: Pass the where condition correctly, not wrapped in a where object
            await databaseController.updateSensor(
                updateData,
                { sensor_id: sensorId }
            );
            
            return await databaseController.findSensorById(sensorId);
        } catch (error) {
            logger.error(`Error in SensorService.updateSensorStatus: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}

// Create and export a singleton instance
export const sensorService = new SensorService();

export default sensorService;