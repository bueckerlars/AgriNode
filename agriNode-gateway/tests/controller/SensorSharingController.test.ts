import sensorSharingController from '../../src/controller/SensorSharingController';
import sensorSharingService from '../../src/services/SensorSharingService';
import { createMockRequest, createMockResponse, testUser } from '../testHelpers';

// Mock sensor sharing service
jest.mock('../../src/services/SensorSharingService', () => ({
  shareSensor: jest.fn(),
  unshareWithUser: jest.fn(),
  removeAllSharings: jest.fn(),
  getSensorsSharedWithUser: jest.fn(),
  getSharedUsers: jest.fn()
}));

// Mock the logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('SensorSharingController', () => {
  const testSensor = {
    sensor_id: 'test-sensor-id',
    user_id: testUser.id,
    name: 'Test Sensor'
  };
  
  const sharedUser = {
    user_id: 'shared-user-id',
    username: 'shareduser',
    email: 'shared@example.com'
  };
  
  const testSharing = {
    sharing_id: 'test-sharing-id',
    sensor_id: testSensor.sensor_id,
    owner_id: testUser.id,
    shared_with_id: sharedUser.user_id,
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Validation', () => {
    it('should return 401 when user is not authenticated for shareSensor', async () => {
      // Setup - request without user
      const req = createMockRequest({
        params: { sensorId: testSensor.sensor_id },
        body: { userId: sharedUser.user_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.shareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorSharingService.shareSensor).not.toHaveBeenCalled();
    });
    
    it('should return 401 when user is not authenticated for unshareSensor', async () => {
      // Setup - request without user
      const req = createMockRequest({
        params: { 
          sensorId: testSensor.sensor_id,
          sharedUserId: sharedUser.user_id 
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.unshareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorSharingService.unshareWithUser).not.toHaveBeenCalled();
    });
    
    it('should return 401 when user is not authenticated for removeAllSharings', async () => {
      // Setup - request without user
      const req = createMockRequest({
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.removeAllSharings(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorSharingService.removeAllSharings).not.toHaveBeenCalled();
    });
    
    it('should return 401 when user is not authenticated for getSharedSensors', async () => {
      // Setup - request without user
      const req = createMockRequest({});
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.getSharedSensors(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorSharingService.getSensorsSharedWithUser).not.toHaveBeenCalled();
    });
    
    it('should return 401 when user is not authenticated for getSharedUsers', async () => {
      // Setup - request without user
      const req = createMockRequest({
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.getSharedUsers(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorSharingService.getSharedUsers).not.toHaveBeenCalled();
    });
  });

  describe('shareSensor', () => {
    it('should share a sensor successfully', async () => {
      // Setup
      (sensorSharingService.shareSensor as jest.Mock).mockResolvedValue(testSharing);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        body: { userId: sharedUser.user_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.shareSensor(req as any, res as any);
      
      // Assert
      expect(sensorSharingService.shareSensor).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id, sharedUser.user_id
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sensor wurde erfolgreich geteilt',
        data: testSharing
      });
    });
    
    it('should validate required parameters', async () => {
      // Setup - missing userId
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        body: {}
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.shareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor-ID und Benutzer-ID sind erforderlich'
      });
      expect(sensorSharingService.shareSensor).not.toHaveBeenCalled();
    });
    
    it('should handle "not found" errors', async () => {
      // Setup
      (sensorSharingService.shareSensor as jest.Mock).mockRejectedValue(
        new Error('Sensor not found')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'non-existent-id' },
        body: { userId: sharedUser.user_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.shareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor not found'
      });
    });
    
    it('should handle "already shared" errors', async () => {
      // Setup
      (sensorSharingService.shareSensor as jest.Mock).mockRejectedValue(
        new Error('Sensor is already shared with this user')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        body: { userId: sharedUser.user_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.shareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor is already shared with this user'
      });
    });
    
    it('should handle generic errors', async () => {
      // Setup
      (sensorSharingService.shareSensor as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        body: { userId: sharedUser.user_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.shareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Fehler beim Teilen des Sensors',
        error: 'Database error'
      });
    });
  });

  describe('unshareSensor', () => {
    it('should unshare a sensor successfully', async () => {
      // Setup
      (sensorSharingService.unshareWithUser as jest.Mock).mockResolvedValue(true);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { 
          sensorId: testSensor.sensor_id,
          sharedUserId: sharedUser.user_id 
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.unshareSensor(req as any, res as any);
      
      // Assert
      expect(sensorSharingService.unshareWithUser).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id, sharedUser.user_id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Freigabe des Sensors wurde erfolgreich aufgehoben'
      });
    });
    
    it('should validate required parameters', async () => {
      // Setup - missing sharedUserId
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { 
          sensorId: testSensor.sensor_id,
          // Missing sharedUserId
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.unshareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor-ID und Benutzer-ID sind erforderlich'
      });
      expect(sensorSharingService.unshareWithUser).not.toHaveBeenCalled();
    });
    
    it('should handle "not found" errors', async () => {
      // Setup
      (sensorSharingService.unshareWithUser as jest.Mock).mockRejectedValue(
        new Error('Sensor sharing not found')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { 
          sensorId: 'non-existent-id',
          sharedUserId: sharedUser.user_id 
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.unshareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor sharing not found'
      });
    });
    
    it('should handle permission errors', async () => {
      // Setup
      (sensorSharingService.unshareWithUser as jest.Mock).mockRejectedValue(
        new Error('You do not have permission to unshare this sensor')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { 
          sensorId: 'someone-elses-sensor',
          sharedUserId: sharedUser.user_id 
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.unshareSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to unshare this sensor'
      });
    });
  });

  describe('removeAllSharings', () => {
    it('should remove all sharings successfully', async () => {
      // Setup
      (sensorSharingService.removeAllSharings as jest.Mock).mockResolvedValue(3); // 3 sharings removed
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.removeAllSharings(req as any, res as any);
      
      // Assert
      expect(sensorSharingService.removeAllSharings).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Alle Freigaben für den Sensor wurden erfolgreich entfernt'
      });
    });
    
    it('should validate required parameters', async () => {
      // Setup - missing sensorId
      const req = createMockRequest({
        user: { id: testUser.id },
        params: {} // Missing sensorId
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.removeAllSharings(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor-ID ist erforderlich'
      });
      expect(sensorSharingService.removeAllSharings).not.toHaveBeenCalled();
    });
    
    it('should handle "not found" errors', async () => {
      // Setup
      (sensorSharingService.removeAllSharings as jest.Mock).mockRejectedValue(
        new Error('Sensor not found')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'non-existent-id' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.removeAllSharings(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor not found'
      });
    });
    
    it('should handle permission errors', async () => {
      // Setup
      (sensorSharingService.removeAllSharings as jest.Mock).mockRejectedValue(
        new Error('You do not have permission to modify this sensor')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'someone-elses-sensor' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.removeAllSharings(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to modify this sensor'
      });
    });
  });

  describe('getSharedSensors', () => {
    it('should get shared sensors successfully', async () => {
      // Setup
      const sharedSensors = [
        {
          sensor_id: 'shared-sensor-1',
          name: 'Shared Sensor 1',
          owner: { username: 'owner1' }
        },
        {
          sensor_id: 'shared-sensor-2',
          name: 'Shared Sensor 2',
          owner: { username: 'owner2' }
        }
      ];
      
      (sensorSharingService.getSensorsSharedWithUser as jest.Mock).mockResolvedValue(sharedSensors);
      
      const req = createMockRequest({
        user: { id: testUser.id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.getSharedSensors(req as any, res as any);
      
      // Assert
      expect(sensorSharingService.getSensorsSharedWithUser).toHaveBeenCalledWith(testUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sharedSensors
      });
    });
    
    it('should handle errors when getting shared sensors', async () => {
      // Setup
      (sensorSharingService.getSensorsSharedWithUser as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.getSharedSensors(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Fehler beim Abrufen der geteilten Sensoren',
        error: 'Database error'
      });
    });
  });

  describe('getSharedUsers', () => {
    it('should get shared users successfully', async () => {
      // Setup
      const sharedUsers = [
        {
          user_id: 'shared-user-1',
          username: 'shareduser1',
          email: 'shared1@example.com'
        },
        {
          user_id: 'shared-user-2',
          username: 'shareduser2',
          email: 'shared2@example.com'
        }
      ];
      
      (sensorSharingService.getSharedUsers as jest.Mock).mockResolvedValue(sharedUsers);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.getSharedUsers(req as any, res as any);
      
      // Assert
      expect(sensorSharingService.getSharedUsers).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sharedUsers
      });
    });
    
    it('should validate required parameters', async () => {
      // Setup - missing sensorId
      const req = createMockRequest({
        user: { id: testUser.id },
        params: {} // Missing sensorId
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.getSharedUsers(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor-ID ist erforderlich'
      });
      expect(sensorSharingService.getSharedUsers).not.toHaveBeenCalled();
    });
    
    it('should handle "not found" errors', async () => {
      // Setup
      (sensorSharingService.getSharedUsers as jest.Mock).mockRejectedValue(
        new Error('Sensor not found')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'non-existent-id' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.getSharedUsers(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor not found'
      });
    });
    
    it('should handle permission errors', async () => {
      // Setup
      (sensorSharingService.getSharedUsers as jest.Mock).mockRejectedValue(
        new Error('You do not have permission to view this sensor')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'someone-elses-sensor' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorSharingController.getSharedUsers(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to view this sensor'
      });
    });
  });
});