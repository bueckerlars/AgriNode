import SensorDataController from '../../src/controller/SensorDataController';
import SensorDataService from '../../src/services/SensorDataService';
import sensorSharingService from '../../src/services/SensorSharingService';
import { createMockRequest, createMockResponse, testUser } from '../testHelpers';

// Mock SensorDataService
jest.mock('../../src/services/SensorDataService', () => ({
  createSensorData: jest.fn(),
  getAllSensorData: jest.fn(),
  getSensorDataById: jest.fn(),
  getSensorDataBySensorId: jest.fn(),
  getSensorDataByTimeRange: jest.fn(),
  updateSensorData: jest.fn(),
  deleteSensorData: jest.fn(),
  deleteAllSensorData: jest.fn(),
}));

// Mock SensorSharingService
jest.mock('../../src/services/SensorSharingService', () => ({
  checkSensorAccess: jest.fn(),
}));

// Mock the logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('SensorDataController', () => {
  const testSensor = {
    sensor_id: 'test-sensor-id',
    user_id: testUser.id,
    name: 'Test Sensor'
  };
  
  const testSensorData = {
    data_id: 'test-data-id',
    sensor_id: testSensor.sensor_id,
    temperature: 25.5,
    humidity: 60,
    moisture: 45,
    light: 800,
    timestamp: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSensorData', () => {
    it('should create sensor data successfully', async () => {
      // Setup
      (SensorDataService.createSensorData as jest.Mock).mockResolvedValue(testSensorData);
      
      const req = createMockRequest({
        body: {
          sensor_id: testSensor.sensor_id,
          temperature: 25.5,
          humidity: 60,
          moisture: 45,
          light: 800
        }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.createSensorData(req as any, res as any);
      
      // Assert
      expect(SensorDataService.createSensorData).toHaveBeenCalledWith(
        expect.objectContaining({
          sensor_id: testSensor.sensor_id,
          temperature: 25.5,
          humidity: 60,
          moisture: 45,
          light: 800,
          timestamp: expect.any(Date)
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(testSensorData);
    });
    
    it('should handle errors during data creation', async () => {
      // Setup
      (SensorDataService.createSensorData as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const req = createMockRequest({
        body: {
          sensor_id: testSensor.sensor_id,
          temperature: 25.5
        }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.createSensorData(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create sensor data',
        error: 'Database error'
      });
    });
  });

  describe('getAllSensorData', () => {
    it('should get all sensor data', async () => {
      // Setup
      const allSensorData = [testSensorData, { ...testSensorData, data_id: 'data-2' }];
      (SensorDataService.getAllSensorData as jest.Mock).mockResolvedValue(allSensorData);
      
      const req = createMockRequest({
        user: {
          id: testUser.id,
          role: 'admin' // Admin should see all data
        }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getAllSensorData(req as any, res as any);
      
      // Assert
      expect(SensorDataService.getAllSensorData).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(allSensorData);
    });
    
    it('should handle errors when fetching all data', async () => {
      // Setup
      (SensorDataService.getAllSensorData as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const req = createMockRequest({
        user: {
          id: testUser.id,
          role: 'admin'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getAllSensorData(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to fetch sensor data',
        error: 'Database error'
      });
    });
  });

  describe('getSensorDataById', () => {
    it('should get sensor data by ID successfully', async () => {
      // Setup
      (SensorDataService.getSensorDataById as jest.Mock).mockResolvedValue(testSensorData);
      
      const req = createMockRequest({
        params: { id: testSensorData.data_id }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorDataById(req as any, res as any);
      
      // Assert
      expect(SensorDataService.getSensorDataById).toHaveBeenCalledWith(testSensorData.data_id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(testSensorData);
    });
    
    it('should return 404 if data not found', async () => {
      // Setup
      (SensorDataService.getSensorDataById as jest.Mock).mockResolvedValue(null);
      
      const req = createMockRequest({
        params: { id: 'non-existent-id' }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorDataById(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Sensor data not found' });
    });
    
    it('should handle errors when fetching data by ID', async () => {
      // Setup
      (SensorDataService.getSensorDataById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const req = createMockRequest({
        params: { id: testSensorData.data_id }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorDataById(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to fetch sensor data',
        error: 'Database error'
      });
    });
  });

  describe('getSensorData', () => {
    it('should get data for a specific sensor successfully', async () => {
      // Setup
      const sensorDataList = [testSensorData, { ...testSensorData, data_id: 'data-2' }];
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({
        hasAccess: true,
        isOwner: true
      });
      (SensorDataService.getSensorDataBySensorId as jest.Mock).mockResolvedValue(sensorDataList);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorData(req as any, res as any);
      
      // Assert
      expect(sensorSharingService.checkSensorAccess).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id
      );
      expect(SensorDataService.getSensorDataBySensorId).toHaveBeenCalledWith(
        testSensor.sensor_id
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sensorDataList
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
      await SensorDataController.getSensorData(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Sensor ID is required'
      });
      expect(SensorDataService.getSensorDataBySensorId).not.toHaveBeenCalled();
    });
    
    it('should require authentication', async () => {
      // Setup
      const req = createMockRequest({
        // Missing user
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorData(req as any, res as any);
      
      // Assert - wir erwarten jetzt einen 401er Fehler, da der Controller verbessert wurde
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(SensorDataService.getSensorDataBySensorId).not.toHaveBeenCalled();
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
      await SensorDataController.getSensorData(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have access to this sensor data'
      });
      expect(SensorDataService.getSensorDataBySensorId).not.toHaveBeenCalled();
    });
  });

  describe('getSensorDataByTimeRange', () => {
    it('should get data within a time range successfully', async () => {
      // Setup
      const startTime = '2023-01-01T00:00:00Z';
      const endTime = '2023-01-31T23:59:59Z';
      const sensorDataList = [testSensorData, { ...testSensorData, data_id: 'data-2' }];
      
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({
        hasAccess: true,
        isOwner: true
      });
      (SensorDataService.getSensorDataByTimeRange as jest.Mock).mockResolvedValue(sensorDataList);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        query: { startTime, endTime }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorDataByTimeRange(req as any, res as any);
      
      // Assert
      expect(sensorSharingService.checkSensorAccess).toHaveBeenCalledWith(
        testSensor.sensor_id, testUser.id
      );
      expect(SensorDataService.getSensorDataByTimeRange).toHaveBeenCalledWith(
        testSensor.sensor_id,
        new Date(startTime),
        new Date(endTime)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sensorDataList
      });
    });
    
    it('should validate required parameters', async () => {
      // Setup - missing time range
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        query: {} // Missing startTime and endTime
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorDataByTimeRange(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start time and end time are required'
      });
      expect(SensorDataService.getSensorDataByTimeRange).not.toHaveBeenCalled();
    });
    
    it('should validate date formats', async () => {
      // Setup - invalid date format
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: testSensor.sensor_id },
        query: { 
          startTime: 'not-a-date',
          endTime: '2023-01-31T23:59:59Z'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorDataByTimeRange(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid date format'
      });
      expect(SensorDataService.getSensorDataByTimeRange).not.toHaveBeenCalled();
    });
    
    it('should require authentication', async () => {
      // Setup
      const startTime = '2023-01-01T00:00:00Z';
      const endTime = '2023-01-31T23:59:59Z';
      const req = createMockRequest({
        // Missing user
        params: { sensorId: testSensor.sensor_id },
        query: { startTime, endTime }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorDataByTimeRange(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(SensorDataService.getSensorDataByTimeRange).not.toHaveBeenCalled();
    });
    
    it('should verify sensor access', async () => {
      // Setup
      const startTime = '2023-01-01T00:00:00Z';
      const endTime = '2023-01-31T23:59:59Z';
      (sensorSharingService.checkSensorAccess as jest.Mock).mockResolvedValue({
        hasAccess: false,
        isOwner: false
      });
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { sensorId: 'someone-elses-sensor' },
        query: { startTime, endTime }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.getSensorDataByTimeRange(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have access to this sensor data'
      });
      expect(SensorDataService.getSensorDataByTimeRange).not.toHaveBeenCalled();
    });
  });

  describe('updateSensorData', () => {
    it('should update sensor data successfully', async () => {
      // Setup
      const updateData = { temperature: 26.5, humidity: 65 };
      const updatedData = { ...testSensorData, ...updateData };
      
      (SensorDataService.updateSensorData as jest.Mock).mockResolvedValue([1, []]);
      (SensorDataService.getSensorDataById as jest.Mock).mockResolvedValue(updatedData);
      
      const req = createMockRequest({
        params: { id: testSensorData.data_id },
        body: updateData
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.updateSensorData(req as any, res as any);
      
      // Assert
      expect(SensorDataService.updateSensorData).toHaveBeenCalledWith(
        testSensorData.data_id, updateData
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedData);
    });
    
    it('should prevent updating sensor_id', async () => {
      // Setup
      const updateData = { sensor_id: 'another-sensor-id', temperature: 26.5 };
      const updatedData = { ...testSensorData, temperature: 26.5 };
      
      (SensorDataService.updateSensorData as jest.Mock).mockResolvedValue([1, []]);
      (SensorDataService.getSensorDataById as jest.Mock).mockResolvedValue(updatedData);
      
      const req = createMockRequest({
        params: { id: testSensorData.data_id },
        body: updateData
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.updateSensorData(req as any, res as any);
      
      // Assert
      // Should not include sensor_id in the update data
      expect(SensorDataService.updateSensorData).toHaveBeenCalledWith(
        testSensorData.data_id, 
        { temperature: 26.5 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should return 404 if data not found', async () => {
      // Setup
      (SensorDataService.updateSensorData as jest.Mock).mockResolvedValue([0, []]);
      
      const req = createMockRequest({
        params: { id: 'non-existent-id' },
        body: { temperature: 26.5 }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.updateSensorData(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Sensor data not found or not updated' 
      });
      expect(SensorDataService.getSensorDataById).not.toHaveBeenCalled();
    });
  });

  describe('deleteSensorData', () => {
    it('should delete sensor data successfully', async () => {
      // Setup
      (SensorDataService.deleteSensorData as jest.Mock).mockResolvedValue(1);
      
      const req = createMockRequest({
        params: { id: testSensorData.data_id }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.deleteSensorData(req as any, res as any);
      
      // Assert
      expect(SensorDataService.deleteSensorData).toHaveBeenCalledWith(testSensorData.data_id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Sensor data deleted successfully' 
      });
    });
    
    it('should return 404 if data not found', async () => {
      // Setup
      (SensorDataService.deleteSensorData as jest.Mock).mockResolvedValue(0);
      
      const req = createMockRequest({
        params: { id: 'non-existent-id' }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.deleteSensorData(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Sensor data not found or not deleted' 
      });
    });
  });

  describe('deleteAllSensorData', () => {
    it('should delete all data for a sensor successfully', async () => {
      // Setup
      (SensorDataService.deleteAllSensorData as jest.Mock).mockResolvedValue(5); // 5 records deleted
      
      const req = createMockRequest({
        params: { sensorId: testSensor.sensor_id }
      });
      const res = createMockResponse();
      
      // Execute
      await SensorDataController.deleteAllSensorData(req as any, res as any);
      
      // Assert
      expect(SensorDataService.deleteAllSensorData).toHaveBeenCalledWith(testSensor.sensor_id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Sensor data deleted successfully',
        count: 5
      });
    });
  });
});