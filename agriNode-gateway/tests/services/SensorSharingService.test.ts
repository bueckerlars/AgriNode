import { v4 as uuidv4 } from 'uuid';
import sensorSharingService from '../../src/services/SensorSharingService';
import databaseController from '../../src/controller/DatabaseController';
import { testUser, testAdmin } from '../testHelpers';

// Mock dependencies
jest.mock('uuid');
jest.mock('../../src/controller/DatabaseController');
jest.mock('../../src/config/logger');

describe('SensorSharingService', () => {
  // Sample test data
  const ownerId = testUser.user_id;
  const sharedWithId = testAdmin.user_id;
  const sensorId = 'test-sensor-id';
  const sharingId = 'test-sharing-id';
  
  const sampleSensor = {
    sensor_id: sensorId,
    user_id: ownerId,
    name: 'Test Sensor',
    type: 'temperature',
    location: 'Garden'
  };
  
  const sampleSharing = {
    sharing_id: sharingId,
    sensor_id: sensorId,
    owner_id: ownerId,
    shared_with_id: sharedWithId,
    created_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shareSensor', () => {
    it('should share a sensor successfully', async () => {
      // Mock UUID generation
      (uuidv4 as jest.Mock).mockReturnValue(sharingId);
      
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testAdmin);
      (databaseController.findOneSensorSharing as jest.Mock).mockResolvedValue(null);
      (databaseController.createSensorSharing as jest.Mock).mockResolvedValue(sampleSharing);

      // Call the service method
      const result = await sensorSharingService.shareSensor(sensorId, ownerId, sharedWithId);

      // Assertions
      expect(databaseController.findOneSensor).toHaveBeenCalledWith({
        where: { sensor_id: sensorId, user_id: ownerId }
      });
      expect(databaseController.findUserById).toHaveBeenCalledWith(sharedWithId);
      expect(databaseController.findOneSensorSharing).toHaveBeenCalledWith({
        where: {
          sensor_id: sensorId,
          owner_id: ownerId,
          shared_with_id: sharedWithId
        }
      });
      expect(databaseController.createSensorSharing).toHaveBeenCalledWith({
        sharing_id: sharingId,
        sensor_id: sensorId,
        owner_id: ownerId,
        shared_with_id: sharedWithId,
        status: 'pending'
      });
      expect(result).toEqual(sampleSharing);
    });

    it('should throw error if sensor not found or not owned by user', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(
        sensorSharingService.shareSensor(sensorId, ownerId, sharedWithId)
      ).rejects.toThrow('Sensor not found or you do not have permission to share it');

      // Should not proceed with further checks
      expect(databaseController.findUserById).not.toHaveBeenCalled();
    });

    it('should throw error if user to share with not found', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.findUserById as jest.Mock).mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(
        sensorSharingService.shareSensor(sensorId, ownerId, 'non-existent-user')
      ).rejects.toThrow('User to share with not found');

      // Should not proceed with sharing
      expect(databaseController.createSensorSharing).not.toHaveBeenCalled();
    });

    it('should throw error if sensor already shared with user', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testAdmin);
      (databaseController.findOneSensorSharing as jest.Mock).mockResolvedValue(sampleSharing);

      // Call the service method and expect it to throw
      await expect(
        sensorSharingService.shareSensor(sensorId, ownerId, sharedWithId)
      ).rejects.toThrow('Sensor is already shared with this user');

      // Should not proceed with creating sharing
      expect(databaseController.createSensorSharing).not.toHaveBeenCalled();
    });
  });

  describe('unshareWithUser', () => {
    it('should unshare a sensor successfully', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.deleteSensorSharing as jest.Mock).mockResolvedValue(1);

      // Call the service method
      const result = await sensorSharingService.unshareWithUser(sensorId, ownerId, sharedWithId);

      // Assertions
      expect(databaseController.findOneSensor).toHaveBeenCalledWith({
        where: { sensor_id: sensorId, user_id: ownerId }
      });
      expect(databaseController.deleteSensorSharing).toHaveBeenCalledWith({
        sensor_id: sensorId,
        owner_id: ownerId,
        shared_with_id: sharedWithId
      });
      expect(result).toBe(true);
    });

    it('should throw error if sensor not found or not owned by user', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(
        sensorSharingService.unshareWithUser(sensorId, ownerId, sharedWithId)
      ).rejects.toThrow('Sensor not found or you do not have permission to unshare it');

      // Should not proceed with deletion
      expect(databaseController.deleteSensorSharing).not.toHaveBeenCalled();
    });

    it('should throw error if sharing record not found', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.deleteSensorSharing as jest.Mock).mockResolvedValue(0);

      // Call the service method and expect it to throw
      await expect(
        sensorSharingService.unshareWithUser(sensorId, ownerId, 'non-shared-user')
      ).rejects.toThrow('Sharing record not found');
    });
  });

  describe('removeAllSharings', () => {
    it('should remove all sharings for a sensor', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.deleteSensorSharing as jest.Mock).mockResolvedValue(3);

      // Call the service method
      const result = await sensorSharingService.removeAllSharings(sensorId, ownerId);

      // Assertions
      expect(databaseController.findOneSensor).toHaveBeenCalledWith({
        where: { sensor_id: sensorId, user_id: ownerId }
      });
      expect(databaseController.deleteSensorSharing).toHaveBeenCalledWith({
        sensor_id: sensorId,
        owner_id: ownerId
      });
      expect(result).toBe(true);
    });

    it('should throw error if sensor not found or not owned by user', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(
        sensorSharingService.removeAllSharings(sensorId, ownerId)
      ).rejects.toThrow('Sensor not found or you do not have permission to remove sharings');

      // Should not proceed with deletion
      expect(databaseController.deleteSensorSharing).not.toHaveBeenCalled();
    });

    it('should return true even if no sharings exist', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.deleteSensorSharing as jest.Mock).mockResolvedValue(0);

      // Call the service method
      const result = await sensorSharingService.removeAllSharings(sensorId, ownerId);

      // Should return true even when no records deleted
      expect(result).toBe(true);
    });
  });

  describe('getSensorsSharedWithUser', () => {
    it('should return all sensors shared with user', async () => {
      const sharedSensors = [
        { ...sampleSensor, sensor_id: 'sensor-1' },
        { ...sampleSensor, sensor_id: 'sensor-2' }
      ];
      
      const sharings = [
        { ...sampleSharing, sensor_id: 'sensor-1', status: 'accepted' },
        { ...sampleSharing, sensor_id: 'sensor-2', status: 'accepted' },
        { ...sampleSharing, sensor_id: 'sensor-3', status: 'pending' } // This one should be filtered out
      ];

      // Mock database calls
      (databaseController.findSensorSharingsBySharedWith as jest.Mock).mockResolvedValue(sharings);
      (databaseController.findAllSensors as jest.Mock).mockResolvedValue(sharedSensors);

      // Call the service method
      const result = await sensorSharingService.getSensorsSharedWithUser(sharedWithId);

      // Assertions
      expect(databaseController.findSensorSharingsBySharedWith).toHaveBeenCalledWith(sharedWithId);
      expect(databaseController.findAllSensors).toHaveBeenCalledWith({
        where: { sensor_id: ['sensor-1', 'sensor-2'] } // Only accepted sharings
      });
      expect(result).toEqual(sharedSensors);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no sensors shared with user', async () => {
      // Mock database calls to return empty results
      (databaseController.findSensorSharingsBySharedWith as jest.Mock).mockResolvedValue([]);

      // Call the service method
      const result = await sensorSharingService.getSensorsSharedWithUser(sharedWithId);

      // Assertions
      expect(databaseController.findAllSensors).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('checkSensorAccess', () => {
    it('should return true for access and ownership if user is owner', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);

      // Call the service method
      const result = await sensorSharingService.checkSensorAccess(sensorId, ownerId);

      // Assertions
      expect(result).toEqual({ hasAccess: true, isOwner: true });
      expect(databaseController.findOneSensorSharing).not.toHaveBeenCalled(); // Should not check sharing
    });

    it('should return true for access but false for ownership if user has shared access', async () => {
      // Mock database calls - sensor owned by someone else
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue({
        ...sampleSensor,
        user_id: 'different-owner'
      });
      (databaseController.findOneSensorSharing as jest.Mock).mockResolvedValue(sampleSharing);

      // Call the service method
      const result = await sensorSharingService.checkSensorAccess(sensorId, sharedWithId);

      // Assertions
      expect(result).toEqual({ hasAccess: true, isOwner: false });
    });

    it('should return false for both access and ownership if user has no access', async () => {
      // Mock database calls - sensor owned by someone else and no sharing
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue({
        ...sampleSensor,
        user_id: 'different-owner'
      });
      (databaseController.findOneSensorSharing as jest.Mock).mockResolvedValue(null);

      // Call the service method
      const result = await sensorSharingService.checkSensorAccess(sensorId, 'no-access-user');

      // Assertions
      expect(result).toEqual({ hasAccess: false, isOwner: false });
    });

    it('should throw error if sensor does not exist', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(
        sensorSharingService.checkSensorAccess(sensorId, ownerId)
      ).rejects.toThrow('Sensor not found');
    });
  });

  describe('getSharedUsers', () => {
    it('should return all users with whom a sensor is shared', async () => {
      // Sample shared users data
      const sharedUsers = [
        {
          sharing_id: sharingId,
          shared_with_id: sharedWithId,
          sharedWith: {
            user_id: sharedWithId,
            username: 'testadmin',
            email: 'admin@example.com'
          }
        },
        {
          sharing_id: 'sharing-id-2',
          shared_with_id: 'user-id-2',
          sharedWith: {
            user_id: 'user-id-2',
            username: 'anotheruser',
            email: 'another@example.com'
          }
        }
      ];

      // Expected result after transformation
      const expectedResult = [
        {
          sharing_id: sharingId,
          user_id: sharedWithId,
          username: 'testadmin',
          email: 'admin@example.com'
        },
        {
          sharing_id: 'sharing-id-2',
          user_id: 'user-id-2',
          username: 'anotheruser',
          email: 'another@example.com'
        }
      ];

      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.getModel as jest.Mock).mockReturnValue({});
      (databaseController.findAllSensorSharings as jest.Mock).mockResolvedValue(sharedUsers);

      // Call the service method
      const result = await sensorSharingService.getSharedUsers(sensorId, ownerId);

      // Assertions
      expect(databaseController.findOneSensor).toHaveBeenCalledWith({
        where: { sensor_id: sensorId, user_id: ownerId }
      });
      expect(databaseController.findAllSensorSharings).toHaveBeenCalledWith({
        where: { sensor_id: sensorId, owner_id: ownerId },
        include: [expect.any(Object)]
      });
      expect(result).toEqual(expectedResult);
      expect(result.length).toBe(2);
    });

    it('should filter out sharing records with missing user data', async () => {
      // Sample shared users data with one incomplete record
      const sharedUsers = [
        {
          sharing_id: sharingId,
          shared_with_id: sharedWithId,
          sharedWith: {
            user_id: sharedWithId,
            username: 'testadmin',
            email: 'admin@example.com'
          }
        },
        {
          sharing_id: 'sharing-id-2',
          shared_with_id: 'user-id-2',
          sharedWith: null // Missing user data
        }
      ];

      // Expected result after filtering
      const expectedResult = [
        {
          sharing_id: sharingId,
          user_id: sharedWithId,
          username: 'testadmin',
          email: 'admin@example.com'
        }
      ];

      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.getModel as jest.Mock).mockReturnValue({});
      (databaseController.findAllSensorSharings as jest.Mock).mockResolvedValue(sharedUsers);

      // Call the service method
      const result = await sensorSharingService.getSharedUsers(sensorId, ownerId);

      // Assertions
      expect(result).toEqual(expectedResult);
      expect(result.length).toBe(1); // Should have filtered out the incomplete record
    });

    it('should throw error if sensor not found or not owned by user', async () => {
      // Mock database calls
      (databaseController.findOneSensor as jest.Mock).mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(
        sensorSharingService.getSharedUsers(sensorId, ownerId)
      ).rejects.toThrow('Sensor not found or you do not have permission to view sharings');

      // Should not proceed with finding sharings
      expect(databaseController.findAllSensorSharings).not.toHaveBeenCalled();
    });
  });
});