import sensorController from '../../src/controller/SensorController';
import sensorService from '../../src/services/SensorService';
import sensorSharingService from '../../src/services/SensorSharingService';
import { createMockRequest, createMockResponse, testUser } from '../testHelpers';

// Mock the sensor service
jest.mock('../../src/services/SensorService', () => ({
  registerSensor: jest.fn(),
  unregisterSensor: jest.fn(),
  getSensorById: jest.fn(),
  updateSensor: jest.fn(),
  getAllSensorsByUserId: jest.fn(),
  updateSensorStatus: jest.fn()
}));

// Mock sensor sharing service
jest.mock('../../src/services/SensorSharingService', () => ({
  checkSensorAccess: jest.fn()
}));

// Mock the logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('SensorController', () => {
  const testSensor = {
    sensor_id: 'test-sensor-id',
    user_id: testUser.id,
    name: 'Test Sensor',
    unique_device_id: 'sensor-123',
    type: 'soil',
    batteryLevel: 85,
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerSensor', () => {
    it('should return 401 if no user is authenticated', async () => {
      // Setup
      const req = createMockRequest({
        user: null, // No authenticated user
        body: {
          name: 'Test Sensor',
          unique_device_id: 'sensor-123'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.registerSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorService.registerSensor).not.toHaveBeenCalled();
    });

    it('should register a new sensor successfully', async () => {
      // Setup
      (sensorService.registerSensor as jest.Mock).mockResolvedValue(testSensor);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        body: {
          name: 'Test Sensor',
          unique_device_id: 'sensor-123'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.registerSensor(req as any, res as any);
      
      // Assert
      expect(sensorService.registerSensor).toHaveBeenCalledWith(
        testUser.id, 
        expect.objectContaining({
          name: 'Test Sensor',
          unique_device_id: 'sensor-123',
          type: 'generic',
          batteryLevel: 100
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sensor registered successfully',
        data: testSensor
      });
    });
    
    it('should validate required fields', async () => {
      // Setup
      const req = createMockRequest({
        user: { id: testUser.id },
        body: {
          // Missing name or unique_device_id
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.registerSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor name and unique device ID are required'
      });
      expect(sensorService.registerSensor).not.toHaveBeenCalled();
    });
    
    it('should handle sensor registration errors', async () => {
      // Setup
      (sensorService.registerSensor as jest.Mock).mockRejectedValue(
        new Error('Sensor with this ID already exists')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        body: {
          name: 'Test Sensor',
          unique_device_id: 'sensor-123'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.registerSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor with this ID already exists'
      });
    });
    
    it('should handle generic errors', async () => {
      // Setup
      (sensorService.registerSensor as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        body: {
          name: 'Test Sensor',
          unique_device_id: 'sensor-123'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.registerSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to register sensor',
        error: 'Database connection failed'
      });
    });
  });

  describe('unregisterSensor', () => {
    it('should return 401 if no user is authenticated', async () => {
      // Setup
      const req = createMockRequest({
        user: null, // No authenticated user
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.unregisterSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorService.unregisterSensor).not.toHaveBeenCalled();
    });

    it('should unregister a sensor successfully', async () => {
      // Setup
      (sensorService.unregisterSensor as jest.Mock).mockResolvedValue(true);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.unregisterSensor(req as any, res as any);
      
      // Assert
      expect(sensorService.unregisterSensor).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sensor unregistered successfully'
      });
    });
    
    it('should validate required parameters', async () => {
      // Setup
      const req = createMockRequest({
        user: { id: testUser.id },
        params: {} // Missing sensorId
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.unregisterSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor ID is required'
      });
      expect(sensorService.unregisterSensor).not.toHaveBeenCalled();
    });
    
    it('should handle sensor not found error', async () => {
      // Setup
      (sensorService.unregisterSensor as jest.Mock).mockRejectedValue(
        new Error('Sensor not found')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'non-existent-id' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.unregisterSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor not found'
      });
    });
    
    it('should handle permission errors', async () => {
      // Setup
      (sensorService.unregisterSensor as jest.Mock).mockRejectedValue(
        new Error('You do not have permission to unregister this sensor')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'someone-elses-sensor' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.unregisterSensor(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to unregister this sensor'
      });
    });
  });

  describe('getSensorInfo', () => {
    it('should get sensor info successfully', async () => {
      // Setup
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({
        hasAccess: true,
        isOwner: true
      });
      (sensorService.getSensorById as jest.Mock).mockResolvedValue(testSensor);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.getSensorInfo(req as any, res as any);
      
      // Assert
      expect(sensorSharingService.checkSensorAccess).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id
      );
      expect(sensorService.getSensorById).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: testSensor
      });
    });
    
    it('should validate required parameters', async () => {
      // Setup
      const req = createMockRequest({
        user: { id: testUser.id },
        params: {} // Missing sensorId
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.getSensorInfo(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor ID is required'
      });
      expect(sensorService.getSensorById).not.toHaveBeenCalled();
    });
    
    it('should verify sensor access', async () => {
      // Setup
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({
        hasAccess: false,
        isOwner: false
      });
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'someone-elses-sensor' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.getSensorInfo(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have access to this sensor'
      });
      expect(sensorService.getSensorById).not.toHaveBeenCalled();
    });
    
    it('should handle sensor not found', async () => {
      // Setup
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({
        hasAccess: true,
        isOwner: true
      });
      (sensorService.getSensorById as jest.Mock).mockResolvedValue(null);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'non-existent-id' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.getSensorInfo(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor not found'
      });
    });
  });

  describe('updateSensorInfo', () => {
    it('should update sensor info successfully', async () => {
      // Setup
      const updateData = {
        name: 'Updated Sensor Name',
        type: 'temperature'
      };
      const updatedSensor = {
        ...testSensor,
        ...updateData
      };
      
      (sensorService.updateSensor as jest.Mock).mockResolvedValue(updatedSensor);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        body: updateData
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorInfo(req as any, res as any);
      
      // Assert
      expect(sensorService.updateSensor).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id, updateData
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sensor information updated successfully',
        data: updatedSensor
      });
    });
    
    it('should validate required parameters', async () => {
      // Setup
      const req = createMockRequest({
        user: { id: testUser.id },
        params: {}, // Missing sensorId
        body: { name: 'Updated Name' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorInfo(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor ID is required'
      });
      expect(sensorService.updateSensor).not.toHaveBeenCalled();
    });
    
    it('should validate that update data is provided', async () => {
      // Setup
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        body: {} // Empty update data
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorInfo(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No update data provided'
      });
      expect(sensorService.updateSensor).not.toHaveBeenCalled();
    });
    
    it('should handle sensor not found error', async () => {
      // Setup
      (sensorService.updateSensor as jest.Mock).mockRejectedValue(
        new Error('Sensor not found')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'non-existent-id' },
        body: { name: 'Updated Name' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorInfo(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor not found'
      });
    });
    
    it('should handle permission errors', async () => {
      // Setup
      (sensorService.updateSensor as jest.Mock).mockRejectedValue(
        new Error('You do not have permission to update this sensor')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'someone-elses-sensor' },
        body: { name: 'Updated Name' }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorInfo(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to update this sensor'
      });
    });
  });

  describe('getUserSensors', () => {
    it('should get all sensors for the user', async () => {
      // Setup
      const userSensors = [testSensor, { ...testSensor, sensor_id: 'another-sensor' }];
      (sensorService.getAllSensorsByUserId as jest.Mock).mockResolvedValue(userSensors);
      
      const req = createMockRequest({
        user: { id: testUser.id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.getUserSensors(req as any, res as any);
      
      // Assert
      expect(sensorService.getAllSensorsByUserId).toHaveBeenCalledWith(testUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: userSensors
      });
    });
    
    it('should return 401 if no user is authenticated', async () => {
      // Setup
      const req = createMockRequest({
        user: null // No authenticated user
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.getUserSensors(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorService.getAllSensorsByUserId).not.toHaveBeenCalled();
    });

    it('should handle errors when getting user sensors', async () => {
      // Setup
      (sensorService.getAllSensorsByUserId as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const req = createMockRequest({
        user: { id: testUser.id }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.getUserSensors(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve user sensors',
        error: 'Database error'
      });
    });
  });
  
  describe('updateSensorStatus', () => {
    it('should update sensor status successfully', async () => {
      // Setup
      const updatedSensor = {
        ...testSensor,
        batteryLevel: 90
      };
      
      (sensorService.getSensorById as jest.Mock).mockResolvedValue(testSensor);
      (sensorService.updateSensorStatus as jest.Mock).mockResolvedValue(updatedSensor);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        body: { batteryLevel: 90 }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorStatus(req as any, res as any);
      
      // Assert
      expect(sensorService.getSensorById).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id
      );
      expect(sensorService.updateSensorStatus).toHaveBeenCalledWith(
        testSensor.sensor_id, 90
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sensor status updated successfully',
        data: updatedSensor
      });
    });
    
    it('should return 401 if no user is authenticated', async () => {
      // Setup
      const req = createMockRequest({
        user: null, // No authenticated user
        params: { sensorId: testSensor.sensor_id },
        body: { batteryLevel: 90 }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorStatus(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(sensorService.updateSensorStatus).not.toHaveBeenCalled();
    });

    it('should validate required parameters', async () => {
      // Setup
      const req = createMockRequest({
        user: { id: testUser.id },
        params: {}, // Missing sensorId
        body: { batteryLevel: 90 }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorStatus(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor ID is required'
      });
      expect(sensorService.updateSensorStatus).not.toHaveBeenCalled();
    });
    
    it('should handle sensor not found error', async () => {
      // Setup
      (sensorService.getSensorById as jest.Mock).mockResolvedValue(null);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'non-existent-id' },
        body: { batteryLevel: 90 }
      });
      const res = createMockResponse();
      
      // Execute
      await sensorController.updateSensorStatus(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor not found'
      });
      expect(sensorService.updateSensorStatus).not.toHaveBeenCalled();
    });
  });
});