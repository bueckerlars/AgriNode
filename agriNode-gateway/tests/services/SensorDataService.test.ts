import sensorDataService from '../../src/services/SensorDataService';
import databaseController from '../../src/controller/DatabaseController';
import sensorService from '../../src/services/SensorService';
import { SensorData } from '../../src/types';

// Mock dependencies
jest.mock('../../src/controller/DatabaseController');
jest.mock('../../src/services/SensorService');
jest.mock('../../src/config/logger');

describe('SensorDataService', () => {
  // Sample test data
  const sensorId = 'test-sensor-id';
  const deviceId = 'test-device-id';
  const dataId = 'test-data-id';
  
  const sampleSensor = {
    sensor_id: sensorId,
    user_id: 'test-user-id',
    unique_device_id: deviceId,
    name: 'Test Sensor',
    type: 'temperature',
    location: 'Living Room'
  };
  
  const sampleSensorData: SensorData = {
    data_id: dataId,
    sensor_id: sensorId,
    air_temperature: 23.5,
    air_humidity: 45.3,
    soil_moisture: 67.8,
    brightness: 850,
    battery_level: 85,
    timestamp: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSensorData', () => {
    it('should create a new sensor data record successfully', async () => {
      // Mock database calls
      (databaseController.findSensorByDeviceId as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.createSensorData as jest.Mock).mockResolvedValue(sampleSensorData);
      (sensorService.updateSensorStatus as jest.Mock).mockResolvedValue(sampleSensor);

      // Call the service method
      const result = await sensorDataService.createSensorData({
        sensor_id: deviceId, // Pass device ID as sensor_id
        air_temperature: 23.5,
        air_humidity: 45.3,
        soil_moisture: 67.8,
        brightness: 850,
        battery_level: 85
      });

      // Assertions
      expect(databaseController.findSensorByDeviceId).toHaveBeenCalledWith(deviceId);
      expect(databaseController.createSensorData).toHaveBeenCalledWith(expect.objectContaining({
        sensor_id: sensorId, // Should be replaced with actual sensor ID
        air_temperature: 23.5,
        air_humidity: 45.3,
        soil_moisture: 67.8,
        brightness: 850,
        battery_level: 85
      }));
      expect(sensorService.updateSensorStatus).toHaveBeenCalledWith(sensorId, 85);
      expect(result).toEqual(sampleSensorData);
    });

    it('should throw error if device ID is not provided', async () => {
      // Call the service method without device ID
      await expect(
        sensorDataService.createSensorData({
          air_temperature: 23.5,
          air_humidity: 45.3
        })
      ).rejects.toThrow('Device ID is required');

      // Should not attempt to find sensor or create data
      expect(databaseController.findSensorByDeviceId).not.toHaveBeenCalled();
      expect(databaseController.createSensorData).not.toHaveBeenCalled();
    });

    it('should throw error if sensor with device ID is not found', async () => {
      // Mock database calls
      (databaseController.findSensorByDeviceId as jest.Mock).mockResolvedValue(null);

      // Call the service method with non-existent device ID
      await expect(
        sensorDataService.createSensorData({
          sensor_id: 'non-existent-device',
          air_temperature: 23.5
        })
      ).rejects.toThrow('Sensor with device ID non-existent-device not found');

      // Should not attempt to create data
      expect(databaseController.createSensorData).not.toHaveBeenCalled();
    });

    it('should update sensor status without battery level if not provided', async () => {
      // Mock database calls
      (databaseController.findSensorByDeviceId as jest.Mock).mockResolvedValue(sampleSensor);
      (databaseController.createSensorData as jest.Mock).mockResolvedValue({
        ...sampleSensorData,
        battery_level: undefined
      });
      (sensorService.updateSensorStatus as jest.Mock).mockResolvedValue(sampleSensor);

      // Call the service method without battery level
      await sensorDataService.createSensorData({
        sensor_id: deviceId,
        air_temperature: 23.5
      });

      // Should call updateSensorStatus without battery level
      expect(sensorService.updateSensorStatus).toHaveBeenCalledWith(sensorId, undefined);
    });
  });

  describe('getAllSensorData', () => {
    it('should return all sensor data records', async () => {
      const sensorDataList = [sampleSensorData, { ...sampleSensorData, data_id: 'data-2' }];
      
      // Mock database call
      (databaseController.findAllSensorData as jest.Mock).mockResolvedValue(sensorDataList);

      // Call the service method
      const result = await sensorDataService.getAllSensorData();

      // Assertions
      expect(databaseController.findAllSensorData).toHaveBeenCalledWith({});
      expect(result).toEqual(sensorDataList);
      expect(result.length).toBe(2);
    });

    it('should pass options to findAllSensorData', async () => {
      // Fix the type of order to match Sequelize's OrderItem type
      const options = {
        limit: 10,
        order: [['timestamp', 'DESC']] as any  // Use type assertion to avoid TypeScript errors
      };
      
      // Mock database call
      (databaseController.findAllSensorData as jest.Mock).mockResolvedValue([sampleSensorData]);

      // Call the service method with options
      await sensorDataService.getAllSensorData(options);

      // Assertions
      expect(databaseController.findAllSensorData).toHaveBeenCalledWith(options);
    });

    it('should propagate errors from findAllSensorData', async () => {
      // Mock database call to throw error
      (databaseController.findAllSensorData as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Call the service method and expect it to throw
      await expect(sensorDataService.getAllSensorData()).rejects.toThrow('Database error');
    });
  });

  describe('getSensorDataById', () => {
    it('should return sensor data by ID', async () => {
      // Mock database call
      (databaseController.findSensorDataById as jest.Mock).mockResolvedValue(sampleSensorData);

      // Call the service method
      const result = await sensorDataService.getSensorDataById(dataId);

      // Assertions
      expect(databaseController.findSensorDataById).toHaveBeenCalledWith(dataId);
      expect(result).toEqual(sampleSensorData);
    });

    it('should return null if sensor data not found', async () => {
      // Mock database call
      (databaseController.findSensorDataById as jest.Mock).mockResolvedValue(null);

      // Call the service method
      const result = await sensorDataService.getSensorDataById('non-existent-id');

      // Assertions
      expect(result).toBeNull();
    });

    it('should propagate errors from findSensorDataById', async () => {
      // Mock database call to throw error
      (databaseController.findSensorDataById as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Call the service method and expect it to throw
      await expect(sensorDataService.getSensorDataById(dataId)).rejects.toThrow('Database error');
    });
  });

  describe('getSensorDataBySensorId', () => {
    it('should return all data for a specific sensor', async () => {
      const sensorDataList = [
        sampleSensorData,
        { ...sampleSensorData, data_id: 'data-2', timestamp: new Date(Date.now() - 3600000) }
      ];
      
      // Mock database call
      (databaseController.findAllSensorData as jest.Mock).mockResolvedValue(sensorDataList);

      // Call the service method
      const result = await sensorDataService.getSensorDataBySensorId(sensorId);

      // Assertions
      expect(databaseController.findAllSensorData).toHaveBeenCalledWith({
        where: { sensor_id: sensorId },
        order: [['timestamp', 'DESC']]
      });
      expect(result).toEqual(sensorDataList);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no data found for sensor', async () => {
      // Mock database call
      (databaseController.findAllSensorData as jest.Mock).mockResolvedValue([]);

      // Call the service method
      const result = await sensorDataService.getSensorDataBySensorId('non-existent-sensor');

      // Assertions
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('getSensorDataByTimeRange', () => {
    it('should return sensor data within the specified time range', async () => {
      const startTime = new Date('2025-04-17T00:00:00Z');
      const endTime = new Date('2025-04-18T00:00:00Z');
      const sensorDataList = [
        { ...sampleSensorData, timestamp: new Date('2025-04-17T12:00:00Z') },
        { ...sampleSensorData, data_id: 'data-2', timestamp: new Date('2025-04-17T18:00:00Z') }
      ];
      
      // Mock database call
      (databaseController.findAllSensorData as jest.Mock).mockResolvedValue(sensorDataList);

      // Call the service method
      const result = await sensorDataService.getSensorDataByTimeRange(sensorId, startTime, endTime);

      // Assertions
      expect(databaseController.findAllSensorData).toHaveBeenCalledWith({
        where: {
          sensor_id: sensorId,
          timestamp: {
            [Symbol.for('gte')]: startTime,
            [Symbol.for('lte')]: endTime
          }
        },
        order: [['timestamp', 'ASC']]
      });
      expect(result).toEqual(sensorDataList);
      expect(result.length).toBe(2);
    });
  });

  describe('updateSensorData', () => {
    it('should update sensor data successfully', async () => {
      const updateData: Partial<SensorData> = { air_temperature: 25.0 };
      const updateResult = [1, [{ ...sampleSensorData, ...updateData }]];
      
      // Mock database call
      (databaseController.updateSensorData as jest.Mock).mockResolvedValue(updateResult);

      // Call the service method
      const result = await sensorDataService.updateSensorData(dataId, updateData);

      // Assertions
      expect(databaseController.updateSensorData).toHaveBeenCalledWith(updateData, {
        where: { data_id: dataId }
      });
      expect(result).toEqual(updateResult);
    });

    it('should propagate errors from updateSensorData', async () => {
      const updateData: Partial<SensorData> = { air_temperature: 25.0 };
      
      // Mock database call to throw error
      (databaseController.updateSensorData as jest.Mock).mockRejectedValue(new Error('Update error'));

      // Call the service method and expect it to throw
      await expect(
        sensorDataService.updateSensorData(dataId, updateData)
      ).rejects.toThrow('Update error');
    });
  });

  describe('deleteSensorData', () => {
    it('should delete sensor data successfully', async () => {
      // Mock database call
      (databaseController.deleteSensorData as jest.Mock).mockResolvedValue(1);

      // Call the service method
      const result = await sensorDataService.deleteSensorData(dataId);

      // Assertions
      expect(databaseController.deleteSensorData).toHaveBeenCalledWith({
        where: { data_id: dataId }
      });
      expect(result).toBe(1);
    });

    it('should return 0 if no data was deleted', async () => {
      // Mock database call
      (databaseController.deleteSensorData as jest.Mock).mockResolvedValue(0);

      // Call the service method
      const result = await sensorDataService.deleteSensorData('non-existent-id');

      // Assertions
      expect(result).toBe(0);
    });
  });

  describe('deleteAllSensorData', () => {
    it('should delete all data for a specific sensor', async () => {
      // Mock database call
      (databaseController.deleteSensorData as jest.Mock).mockResolvedValue(5);

      // Call the service method
      const result = await sensorDataService.deleteAllSensorData(sensorId);

      // Assertions
      expect(databaseController.deleteSensorData).toHaveBeenCalledWith({
        where: { sensor_id: sensorId }
      });
      expect(result).toBe(5);
    });

    it('should return 0 if no data was deleted', async () => {
      // Mock database call
      (databaseController.deleteSensorData as jest.Mock).mockResolvedValue(0);

      // Call the service method
      const result = await sensorDataService.deleteAllSensorData('empty-sensor');

      // Assertions
      expect(result).toBe(0);
    });
  });
});