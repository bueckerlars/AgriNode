import { Request, Response } from 'express';
import sensorService from '../services/SensorService';
import logger from '../config/logger';
import sensorSharingService from '../services/SensorSharingService';

class SensorController {
    /**
     * Register a new sensor
     */
    async registerSensor(req: Request, res: Response): Promise<void> {
        try {
            // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const userId = req.user.id; // From JWT token via auth middleware
            const sensorData = req.body;
            
            // Validate required fields
            if (!sensorData.name || !sensorData.unique_device_id) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor name and unique device ID are required' 
                });
                return;
            }
            
            // Set default values for new fields if not provided
            if (!sensorData.type) sensorData.type = 'generic';
            if (!sensorData.batteryLevel) sensorData.batteryLevel = 100;
            
            const newSensor = await sensorService.registerSensor(userId, sensorData);
            
            res.status(201).json({
                success: true,
                message: 'Sensor registered successfully',
                data: newSensor
            });
        } catch (error: any) {
            logger.error(`Error in SensorController.registerSensor: ${error.message}`);
            
            if (error.message.includes('already exists')) {
                res.status(409).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Failed to register sensor', 
                error: error.message 
            });
        }
    }

    /**
     * Unregister (delete) a sensor
     */
    async unregisterSensor(req: Request, res: Response): Promise<void> {
        try {
            // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const userId = req.user.id;
            const { sensorId } = req.params;
            
            if (!sensorId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor ID is required' 
                });
                return;
            }
            
            await sensorService.unregisterSensor(sensorId, userId);
            
            res.status(200).json({
                success: true,
                message: 'Sensor unregistered successfully'
            });
        } catch (error: any) {
            logger.error(`Error in SensorController.unregisterSensor: ${error.message}`);
            
            if (error.message.includes('not found')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            if (error.message.includes('permission')) {
                res.status(403).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Failed to unregister sensor', 
                error: error.message 
            });
        }
    }

    /**
     * Get sensor information by ID
     */
    async getSensorInfo(req: Request, res: Response): Promise<void> {
        try {
            // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const userId = req.user.id;
            const { sensorId } = req.params;
            
            if (!sensorId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor ID is required' 
                });
                return;
            }
            
            // Check access (owner or shared)
            const { hasAccess } = await sensorSharingService.checkSensorAccess(sensorId, userId);
            
            if (!hasAccess) {
                res.status(403).json({
                    success: false,
                    message: 'You do not have access to this sensor'
                });
                return;
            }
            
            const sensor = await sensorService.getSensorById(sensorId, userId);
            
            if (!sensor) {
                res.status(404).json({ 
                    success: false, 
                    message: 'Sensor not found' 
                });
                return;
            }
            
            res.status(200).json({
                success: true,
                data: sensor
            });
        } catch (error: any) {
            logger.error(`Error in SensorController.getSensorInfo: ${error.message}`);
            
            res.status(500).json({ 
                success: false, 
                message: 'Failed to retrieve sensor information', 
                error: error.message 
            });
        }
    }

    /**
     * Update sensor information
     */
    async updateSensorInfo(req: Request, res: Response): Promise<void> {
        try {
            // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const userId = req.user.id;
            const { sensorId } = req.params;
            const updateData = req.body;
            
            if (!sensorId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor ID is required' 
                });
                return;
            }
            
            // Validate that there's something to update
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({ 
                    success: false, 
                    message: 'No update data provided' 
                });
                return;
            }
            
            const updatedSensor = await sensorService.updateSensor(sensorId, userId, updateData);
            
            res.status(200).json({
                success: true,
                message: 'Sensor information updated successfully',
                data: updatedSensor
            });
        } catch (error: any) {
            logger.error(`Error in SensorController.updateSensorInfo: ${error.message}`);
            
            if (error.message.includes('not found')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            if (error.message.includes('permission')) {
                res.status(403).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update sensor information', 
                error: error.message 
            });
        }
    }
    
    /**
     * Get all sensors for the authenticated user
     * (both owned and shared)
     */
    async getUserSensors(req: Request, res: Response): Promise<void> {
        try {
            // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const userId = req.user.id;
            
            const sensors = await sensorService.getAllSensorsByUserId(userId);
            
            res.status(200).json({
                success: true,
                data: sensors
            });
        } catch (error: any) {
            logger.error(`Error in SensorController.getUserSensors: ${error.message}`);
            
            res.status(500).json({ 
                success: false, 
                message: 'Failed to retrieve user sensors', 
                error: error.message 
            });
        }
    }

    /**
     * Manually update sensor status (battery level and last updated timestamp)
     */
    async updateSensorStatus(req: Request, res: Response): Promise<void> {
        try {
            // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const userId = req.user.id;
            const { sensorId } = req.params;
            const { batteryLevel } = req.body;
            
            if (!sensorId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor ID is required' 
                });
                return;
            }
            
            // First check if user owns this sensor
            const sensor = await sensorService.getSensorById(sensorId, userId);
            
            if (!sensor) {
                res.status(404).json({ 
                    success: false, 
                    message: 'Sensor not found' 
                });
                return;
            }
            
            const updatedSensor = await sensorService.updateSensorStatus(
                sensorId, 
                batteryLevel
            );
            
            res.status(200).json({
                success: true,
                message: 'Sensor status updated successfully',
                data: updatedSensor
            });
        } catch (error: any) {
            logger.error(`Error in SensorController.updateSensorStatus: ${error.message}`);
            
            if (error.message.includes('not found')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            if (error.message.includes('permission')) {
                res.status(403).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update sensor status', 
                error: error.message 
            });
        }
    }
}

const sensorController = new SensorController();
export default sensorController;