import { v4 as uuidv4 } from 'uuid';
import sensorService from '../../src/services/SensorService';
import databaseController from '../../src/controller/DatabaseController';
import sensorSharingService from '../../src/services/SensorSharingService';
import { testUser } from '../testHelpers';

// Mock dependencies
jest.mock('uuid');
jest.mock('../../src/controller/DatabaseController');
jest.mock('../../src/services/SensorSharingService');
jest.mock('../../src/config/logger');

describe('SensorService', () => {
  // Sample test data
  const userId = 'test-user-id';
  const sensorId = 'test-sensor-id';
  const deviceId = 'test-device-id';
  const sampleSensor = {
    sensor_id: sensorId,
    user_id: userId,
    name: 'Test Sensor',
    type: 'temperature',
    location: 'Living Room',
    unique_device_id: deviceId,
    batteryLevel: 85,
    registered_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerSensor', () => {
    it('should register a new sensor successfully', async () => {
      // Mock the UUID generation
      (uuidv4 as jest.Mock).mockReturnValue(sensorId);
      
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(null);
      (databaseController.createSensor as jest.Mock).mockResolvedValue(sampleSensor);

      // Call the service method
      const result = await sensorService.registerSensor(userId, {
        name: 'Test Sensor',
        type: 'temperature',
        location: 'Living Room',
        unique_device_id: deviceId
      });

      // Assertions
      expect(databaseController.findOneSensor).toHaveBeenCalled();
      expect(databaseController.createSensor).toHaveBeenCalledWith(expect.objectContaining({
        sensor_id: sensorId,
        user_id: userId,
        name: 'Test Sensor',
        type: 'temperature',
        location: 'Living Room',
        unique_device_id: deviceId
      }));
      expect(result).toEqual(sampleSensor);
    });

    it('should use default values when not provided', async () => {
      // Mock the UUID generation
      (uuidv4 as jest.Mock).mockReturnValue(sensorId);
      
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(null);
      (databaseController.createSensor as jest.Mock).mockImplementation(data => data);

      // Call the service method with minimal data
      const result = await sensorService.registerSensor(userId, {
        unique_device_id: deviceId
      });

      // Assertions
      expect(databaseController.createSensor).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Unnamed Sensor',
        type: 'generic',
        batteryLevel: 100
      }));
    });

    it('should throw error if sensor with device ID already exists', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);

      // Call the service method and expect it to throw
      await expect(
        sensorService.registerSensor(userId, { unique_device_id: deviceId })
      ).rejects.toThrow('Sensor with this device ID already exists');

      // Should not attempt to create the sensor
      expect(databaseController.createSensor).not.toHaveBeenCalled();
    });
  });

  describe('unregisterSensor', () => {
    it('should unregister a sensor successfully', async () => {
      // Mock database calls
      (databaseController.findSensorById as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.deleteSensor as jest.Mock).mockResolvedValue(1);

      // Call the service method
      const result = await sensorService.unregisterSensor(sensorId, userId);

      // Assertions
      expect(databaseController.findSensorById).toHaveBeenCalledWith(sensorId);
      expect(databaseController.deleteSensor).toHaveBeenCalledWith({ sensor_id: sensorId });
      expect(result).toBe(true);
    });

    it('should throw error if sensor does not exist', async () => {
      // Mock database calls
      (databaseController.findSensorById as jest.Mock).mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(
        sensorService.unregisterSensor(sensorId, userId)
      ).rejects.toThrow('Sensor not found');

      // Should not attempt to delete the sensor
      expect(databaseController.deleteSensor).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own the sensor', async () => {
      // Mock database calls - sensor exists but belongs to a different user
      (databaseController.findSensorById as jest.Mock).mockResolvedValue({
        ...sampleSensor,
        user_id: 'different-user-id'
      });

      // Call the service method and expect it to throw
      await expect(
        sensorService.unregisterSensor(sensorId, userId)
      ).rejects.toThrow('You do not have permission to unregister this sensor');

      // Should not attempt to delete the sensor
      expect(databaseController.deleteSensor).not.toHaveBeenCalled();
    });
  });

  describe('getSensorById', () => {
    it('should return sensor if user has access', async () => {
      // Mock sensor sharing service and database calls
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({ 
        hasAccess: true, 
        isOwner: true 
      });
      (databaseController.findSensorById as jest.Mock).mockResolvedValue(sampleSensor);

      // Call the service method
      const result = await sensorService.getSensorById(sensorId, userId);

      // Assertions
      expect(sensorSharingService.checkSensorAccess).toHaveBeenCalledWith(sensorId, userId);
      expect(databaseController.findSensorById).toHaveBeenCalledWith(sensorId);
      expect(result).toEqual(sampleSensor);
    });

    it('should return null if user does not have access', async () => {
      // Mock sensor sharing service
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({ 
        hasAccess: false, 
        isOwner: false 
      });

      // Call the service method
      const result = await sensorService.getSensorById(sensorId, userId);

      // Assertions
      expect(result).toBeNull();
      expect(databaseController.findSensorById).not.toHaveBeenCalled();
    });

    it('should return null if sensor does not exist', async () => {
      // Mock sensor sharing service and database calls
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({ 
        hasAccess: true, 
        isOwner: true 
      });
      (databaseController.findSensorById as jest.Mock).mockResolvedValue(null);

      // Call the service method
      const result = await sensorService.getSensorById(sensorId, userId);

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe('getAllSensorsByUserId', () => {
    it('should return owned and shared sensors for user', async () => {
      // Sample sensors
      const ownedSensors = [sampleSensor];
      const sharedSensor = { 
        ...sampleSensor, 
        sensor_id: 'shared-sensor-id', 
        user_id: 'other-user-id' 
      };
      const sharedSensors = [sharedSensor];
      
      // Mock database and service calls
      (databaseController.findAllSensors as jest.Mock).mockResolvedValue(ownedSensors);
      (sensorSharingService.getSensorsSharedWithUser as jest.Mock).mockResolvedValue(sharedSensors);

      // Call the service method
      const result = await sensorService.getAllSensorsByUserId(userId);

      // Assertions
      expect(databaseController.findAllSensors).toHaveBeenCalledWith({
        where: { user_id: userId }
      });
      expect(sensorSharingService.getSensorsSharedWithUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual([...ownedSensors, ...sharedSensors]);
      expect(result.length).toBe(2);
    });
  });

  describe('updateSensor', () => {
    it('should update the sensor if user is owner', async () => {
      const updateData = { name: 'Updated Sensor Name' };
      const updatedSensor = { ...sampleSensor, ...updateData };
      
      // Mock service and database calls
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({ 
        hasAccess: true, 
        isOwner: true 
      });
      (databaseController.updateSensor as jest.Mock).mockResolvedValue([1]);
      (databaseController.findSensorById as jest.Mock).mockResolvedValue(updatedSensor);

      // Call the service method
      const result = await sensorService.updateSensor(sensorId, userId, updateData);

      // Assertions
      expect(sensorSharingService.checkSensorAccess).toHaveBeenCalledWith(sensorId, userId);
      expect(databaseController.updateSensor).toHaveBeenCalled();
      expect(databaseController.findSensorById).toHaveBeenCalledWith(sensorId);
      expect(result).toEqual(updatedSensor);
    });

    it('should prevent sensitive field updates', async () => {
      const sensitiveUpdate = { 
        name: 'Updated Name', 
        sensor_id: 'hacked-id', 
        user_id: 'hacked-user' 
      };
      
      // Mock service and database calls
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({ 
        hasAccess: true, 
        isOwner: true 
      });
      (databaseController.updateSensor as jest.Mock).mockImplementation((data) => {
        expect(data.sensor_id).toBeUndefined();
        expect(data.user_id).toBeUndefined();
        return [1];
      });
      (databaseController.findSensorById as jest.Mock).mockResolvedValue({
        ...sampleSensor,
        name: 'Updated Name'  // Only name should be updated
      });

      // Call the service method
      await sensorService.updateSensor(sensorId, userId, sensitiveUpdate);

      // The assertions are in the mockImplementation
    });

    it('should throw error if user does not have permission to update', async () => {
      // Mock service calls
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({ 
        hasAccess: true, 
        isOwner: false  // User has access but is not owner
      });

      // Call the service method and expect it to throw
      await expect(
        sensorService.updateSensor(sensorId, userId, { name: 'New Name' })
      ).rejects.toThrow('You do not have permission to update this sensor');

      // Should not proceed with update
      expect(databaseController.updateSensor).not.toHaveBeenCalled();
    });
  });

  describe('updateSensorStatus', () => {
    it('should update sensor status with battery level', async () => {
      const batteryLevel = 75;
      const updatedSensor = { ...sampleSensor, batteryLevel };
      
      // Mock database calls
      (databaseController.updateSensor as jest.Mock).mockResolvedValue([1]);
      (databaseController.findSensorById as jest.Mock).mockResolvedValue(updatedSensor);

      // Call the service method
      const result = await sensorService.updateSensorStatus(sensorId, batteryLevel);

      // Assertions
      expect(databaseController.updateSensor).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(Date),
          batteryLevel
        }),
        { sensor_id: sensorId }
      );
      expect(databaseController.findSensorById).toHaveBeenCalledWith(sensorId);
      expect(result).toEqual(updatedSensor);
    });

    it('should update timestamp only when battery level not provided', async () => {
      // Mock database calls
      (databaseController.updateSensor as jest.Mock).mockImplementation((data) => {
        expect(data.updated_at).toBeDefined();
        expect(data.batteryLevel).toBeUndefined();
        return [1];
      });
      (databaseController.findSensorById as jest.Mock).mockResolvedValue(sampleSensor);

      // Call the service method without battery level
      await sensorService.updateSensorStatus(sensorId);

      // The assertions are in the mockImplementation
    });
  });
});