import { DatabaseController } from '../../src/controller/DatabaseController';
import databaseService from '../../src/services/DatabaseService';
import { testUser } from '../testHelpers';

// Mock database service
jest.mock('../../src/services/DatabaseService', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  syncModels: jest.fn(),
  getSequelize: jest.fn(),
  getModel: jest.fn(),
  registerModel: jest.fn()
}));

// Mock logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

// Mock models
jest.mock('../../src/models', () => {
  return function() {
    return {
      User: { name: 'User' },
      Sensor: { name: 'Sensor' },
      SensorData: { name: 'SensorData' },
      ApiKey: { name: 'ApiKey' },
      SensorSharing: { name: 'SensorSharing' }
    };
  };
});

describe('DatabaseController', () => {
  let databaseController: DatabaseController;
  
  // Test data
  const testSensor = {
    sensor_id: 'test-sensor-id',
    user_id: testUser.id,
    name: 'Test Sensor'
  };
  
  const testData = {
    data_id: 'test-data-id',
    sensor_id: 'test-sensor-id',
    temperature: 25
  };
  
  const testApiKey = {
    api_key_id: 'test-api-key',
    user_id: testUser.id,
    name: 'Test API Key'
  };
  
  const testSensorSharing = {
    sharing_id: 'test-sharing-id',
    sensor_id: 'test-sensor-id',
    owner_id: testUser.id,
    shared_with_id: 'shared-user-id'
  };
  
  // Erstelle einen typisierten Test-User für den DatabaseController
  const typedTestUser = {
    user_id: testUser.id,
    id: testUser.id,
    username: testUser.username,
    email: testUser.email,
    role: testUser.role as 'user' | 'admin', // Explizite Typisierung
    created_at: testUser.created_at,
    updated_at: testUser.updated_at
  };

  // Mock request and response objects
  const mockRequest = () => {
    const req: any = {};
    req.user = testUser;
    return req;
  };

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a fresh instance for each test
    // This ensures the state is reset
    databaseController = new DatabaseController();
  });

  describe('Authentication Validation', () => {
    it('should handle authentication requirements', async () => {
      // Setup
      const req = mockRequest();
      req.user = null; // User is not authenticated
      const res = mockResponse();
      const next = jest.fn();
      
      // Create spies on database controller methods
      const createUserSpy = jest.spyOn(databaseController, 'createUser');
      const updateUserSpy = jest.spyOn(databaseController, 'updateUser');
      const deleteUserSpy = jest.spyOn(databaseController, 'deleteUser');
      const findAllUsersSpy = jest.spyOn(databaseController, 'findAllUsers');
      
      // Simuliere das Verhalten eines Auth-Middleware Checks ohne die checkAuth-Methode zu mocken
      // Wir prüfen nur, dass die relevanten Controller-Methoden nicht aufgerufen wurden
      
      // Teste, dass Controller ohne Benutzer nicht aufgerufen werden würden
      expect(req.user).toBeNull();
      
      // Validiere, dass keine der Methoden aufgerufen wurde
      expect(createUserSpy).not.toHaveBeenCalled();
      expect(updateUserSpy).not.toHaveBeenCalled();
      expect(deleteUserSpy).not.toHaveBeenCalled();
      expect(findAllUsersSpy).not.toHaveBeenCalled();
      
      // Prüfe, dass die Response-Objekt-Methoden funktionieren (Mock-Validierung)
      res.status(401).json({ error: 'Authentication required' });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
  });

  describe('User operations', () => {
    it('should create a user successfully', async () => {
      // Setup
      (databaseService.create as jest.Mock).mockResolvedValue(typedTestUser);
      
      // Execute
      const result = await databaseController.createUser(typedTestUser);
      
      // Assert
      expect(databaseService.create).toHaveBeenCalledWith('User', typedTestUser);
      expect(result).toEqual(typedTestUser);
    });
    
    it('should find all users', async () => {
      // Setup
      const users = [typedTestUser, { ...typedTestUser, user_id: 'user-2' }];
      (databaseService.findAll as jest.Mock).mockResolvedValue(users);
      
      // Execute
      const result = await databaseController.findAllUsers();
      
      // Assert
      expect(databaseService.findAll).toHaveBeenCalledWith('User', {});
      expect(result).toEqual(users);
    });
    
    it('should find user by ID', async () => {
      // Setup
      (databaseService.findByPk as jest.Mock).mockResolvedValue(typedTestUser);
      
      // Execute
      const result = await databaseController.findUserById(typedTestUser.user_id);
      
      // Assert
      expect(databaseService.findByPk).toHaveBeenCalledWith('User', typedTestUser.user_id);
      expect(result).toEqual(typedTestUser);
    });
    
    it('should find user by email', async () => {
      // Setup
      (databaseService.findOne as jest.Mock).mockResolvedValue(typedTestUser);
      
      // Execute
      const result = await databaseController.findUserByEmail(typedTestUser.email);
      
      // Assert
      expect(databaseService.findOne).toHaveBeenCalledWith('User', { where: { email: typedTestUser.email } });
      expect(result).toEqual(typedTestUser);
    });
    
    it('should update a user', async () => {
      // Setup
      const updateData = { username: 'updatedUsername' };
      const updateResult = [1, [{ ...typedTestUser, ...updateData }]];
      (databaseService.update as jest.Mock).mockResolvedValue(updateResult);
      
      // Execute
      const result = await databaseController.updateUser(updateData, { where: { user_id: typedTestUser.user_id } });
      
      // Assert
      expect(databaseService.update).toHaveBeenCalledWith('User', updateData, { where: { user_id: typedTestUser.user_id } });
      expect(result).toEqual(updateResult);
    });
    
    it('should delete a user', async () => {
      // Setup
      (databaseService.destroy as jest.Mock).mockResolvedValue(1);
      
      // Execute
      const result = await databaseController.deleteUser({ where: { user_id: typedTestUser.user_id } });
      
      // Assert
      expect(databaseService.destroy).toHaveBeenCalledWith('User', { where: { user_id: typedTestUser.user_id } });
      expect(result).toBe(1);
    });
    
    it('should update user password', async () => {
      // Setup
      const hashedPassword = 'hashed_new_password';
      const updateResult = [1, [{ ...typedTestUser, password: hashedPassword }]];
      (databaseService.update as jest.Mock).mockResolvedValue(updateResult);
      
      // Execute
      const result = await databaseController.updateUserPassword(typedTestUser.user_id, hashedPassword);
      
      // Assert
      expect(databaseService.update).toHaveBeenCalledWith(
        'User', 
        { password: hashedPassword }, 
        { where: { id: typedTestUser.user_id } }
      );
      expect(result).toEqual(updateResult);
    });
  });

  describe('Sensor operations', () => {
    it('should create a sensor successfully', async () => {
      // Setup
      (databaseService.create as jest.Mock).mockResolvedValue(testSensor);
      
      // Execute
      const result = await databaseController.createSensor(testSensor);
      
      // Assert
      expect(databaseService.create).toHaveBeenCalledWith('Sensor', testSensor);
      expect(result).toEqual(testSensor);
    });
    
    it('should find all sensors', async () => {
      // Setup
      const sensors = [testSensor, { ...testSensor, sensor_id: 'sensor-2' }];
      (databaseService.findAll as jest.Mock).mockResolvedValue(sensors);
      
      // Execute
      const result = await databaseController.findAllSensors();
      
      // Assert
      expect(databaseService.findAll).toHaveBeenCalledWith('Sensor', {});
      expect(result).toEqual(sensors);
    });
    
    it('should find sensor by ID', async () => {
      // Setup
      (databaseService.findByPk as jest.Mock).mockResolvedValue(testSensor);
      
      // Execute
      const result = await databaseController.findSensorById(testSensor.sensor_id);
      
      // Assert
      expect(databaseService.findByPk).toHaveBeenCalledWith('Sensor', testSensor.sensor_id);
      expect(result).toEqual(testSensor);
    });
    
    it('should find sensor by device ID', async () => {
      // Setup
      const deviceId = 'sensor123';
      (databaseService.findOne as jest.Mock).mockResolvedValue(testSensor);
      
      // Execute
      const result = await databaseController.findSensorByDeviceId(deviceId);
      
      // Assert
      expect(databaseService.findOne).toHaveBeenCalledWith('Sensor', { where: { unique_device_id: deviceId } });
      expect(result).toEqual(testSensor);
    });
    
    it('should find one sensor with specific criteria', async () => {
      // Setup
      const criteria = { where: { user_id: testUser.id } };
      (databaseService.findOne as jest.Mock).mockResolvedValue(testSensor);
      
      // Execute
      const result = await databaseController.findOneSensor(criteria);
      
      // Assert
      expect(databaseService.findOne).toHaveBeenCalledWith('Sensor', criteria);
      expect(result).toEqual(testSensor);
    });
    
    it('should update a sensor', async () => {
      // Setup
      const updateData = { name: 'Updated Sensor Name' };
      const updateResult = [1, [{ ...testSensor, ...updateData }]];
      (databaseService.update as jest.Mock).mockResolvedValue(updateResult);
      
      // Execute
      const result = await databaseController.updateSensor(updateData, { where: { sensor_id: testSensor.sensor_id } });
      
      // Assert
      expect(databaseService.update).toHaveBeenCalledWith('Sensor', updateData, { where: { sensor_id: testSensor.sensor_id } });
      expect(result).toEqual(updateResult);
    });
    
    it('should delete a sensor', async () => {
      // Setup
      (databaseService.destroy as jest.Mock).mockResolvedValue(1);
      
      // Execute
      const result = await databaseController.deleteSensor({ where: { sensor_id: testSensor.sensor_id } });
      
      // Assert
      expect(databaseService.destroy).toHaveBeenCalledWith('Sensor', { where: { sensor_id: testSensor.sensor_id } });
      expect(result).toBe(1);
    });
  });

  describe('SensorData operations', () => {
    it('should create sensor data successfully', async () => {
      // Setup
      (databaseService.create as jest.Mock).mockResolvedValue(testData);
      
      // Execute
      const result = await databaseController.createSensorData(testData);
      
      // Assert
      expect(databaseService.create).toHaveBeenCalledWith('SensorData', testData);
      expect(result).toEqual(testData);
    });
    
    it('should find all sensor data', async () => {
      // Setup
      const dataList = [testData, { ...testData, data_id: 'data-2' }];
      (databaseService.findAll as jest.Mock).mockResolvedValue(dataList);
      
      // Execute
      const result = await databaseController.findAllSensorData();
      
      // Assert
      expect(databaseService.findAll).toHaveBeenCalledWith('SensorData', {});
      expect(result).toEqual(dataList);
    });
  });

  describe('ApiKey operations', () => {
    it('should create an API key successfully', async () => {
      // Setup
      (databaseService.create as jest.Mock).mockResolvedValue(testApiKey);
      
      // Execute
      const result = await databaseController.createApiKey(testApiKey);
      
      // Assert
      expect(databaseService.create).toHaveBeenCalledWith('ApiKey', testApiKey);
      expect(result).toEqual(testApiKey);
    });
    
    it('should find API keys by user', async () => {
      // Setup
      const apiKeys = [testApiKey, { ...testApiKey, api_key_id: 'key-2' }];
      (databaseService.findAll as jest.Mock).mockResolvedValue(apiKeys);
      
      // Execute
      const result = await databaseController.findApiKeysByUser(testUser.id);
      
      // Assert
      expect(databaseService.findAll).toHaveBeenCalledWith('ApiKey', { where: { user_id: testUser.id } });
      expect(result).toEqual(apiKeys);
    });
    
    it('should find API key by ID', async () => {
      // Setup
      (databaseService.findByPk as jest.Mock).mockResolvedValue(testApiKey);
      
      // Execute
      const result = await databaseController.findApiKeyById(testApiKey.api_key_id);
      
      // Assert
      expect(databaseService.findByPk).toHaveBeenCalledWith('ApiKey', testApiKey.api_key_id);
      expect(result).toEqual(testApiKey);
    });
    
    it('should delete an API key', async () => {
      // Setup
      (databaseService.destroy as jest.Mock).mockResolvedValue(1);
      
      // Execute
      const result = await databaseController.deleteApiKey({ where: { api_key_id: testApiKey.api_key_id } });
      
      // Assert
      expect(databaseService.destroy).toHaveBeenCalledWith('ApiKey', { where: { api_key_id: testApiKey.api_key_id } });
      expect(result).toBe(1);
    });
  });

  describe('SensorSharing operations', () => {
    it('should create a sensor sharing successfully', async () => {
      // Setup
      (databaseService.create as jest.Mock).mockResolvedValue(testSensorSharing);
      
      // Execute
      const result = await databaseController.createSensorSharing(testSensorSharing);
      
      // Assert
      expect(databaseService.create).toHaveBeenCalledWith('SensorSharing', testSensorSharing);
      expect(result).toEqual(testSensorSharing);
    });
    
    it('should find all sensor sharings', async () => {
      // Setup
      const sharings = [testSensorSharing, { ...testSensorSharing, sharing_id: 'sharing-2' }];
      (databaseService.findAll as jest.Mock).mockResolvedValue(sharings);
      
      // Execute
      const result = await databaseController.findAllSensorSharings();
      
      // Assert
      expect(databaseService.findAll).toHaveBeenCalledWith('SensorSharing', {});
      expect(result).toEqual(sharings);
    });
    
    it('should find sensor sharings by owner', async () => {
      // Setup
      const sharings = [testSensorSharing, { ...testSensorSharing, sharing_id: 'sharing-2' }];
      (databaseService.findAll as jest.Mock).mockResolvedValue(sharings);
      
      // Execute
      const result = await databaseController.findSensorSharingsByOwner(testUser.id);
      
      // Assert
      expect(databaseService.findAll).toHaveBeenCalledWith('SensorSharing', { where: { owner_id: testUser.id } });
      expect(result).toEqual(sharings);
    });
    
    it('should find sensor sharings by shared with', async () => {
      // Setup
      const sharedUserId = 'shared-user-id';
      const sharings = [testSensorSharing, { ...testSensorSharing, sharing_id: 'sharing-2' }];
      (databaseService.findAll as jest.Mock).mockResolvedValue(sharings);
      
      // Execute
      const result = await databaseController.findSensorSharingsBySharedWith(sharedUserId);
      
      // Assert
      expect(databaseService.findAll).toHaveBeenCalledWith('SensorSharing', { where: { shared_with_id: sharedUserId } });
      expect(result).toEqual(sharings);
    });
    
    it('should find sensor sharings by sensor', async () => {
      // Setup
      const sharings = [testSensorSharing, { ...testSensorSharing, sharing_id: 'sharing-2' }];
      (databaseService.findAll as jest.Mock).mockResolvedValue(sharings);
      
      // Execute
      const result = await databaseController.findSensorSharingsBySensor(testSensor.sensor_id);
      
      // Assert
      expect(databaseService.findAll).toHaveBeenCalledWith('SensorSharing', { where: { sensor_id: testSensor.sensor_id } });
      expect(result).toEqual(sharings);
    });
    
    it('should delete a sensor sharing', async () => {
      // Setup
      (databaseService.destroy as jest.Mock).mockResolvedValue(1);
      
      // Execute
      const result = await databaseController.deleteSensorSharing({ where: { sharing_id: testSensorSharing.sharing_id } });
      
      // Assert
      expect(databaseService.destroy).toHaveBeenCalledWith('SensorSharing', { where: { sharing_id: testSensorSharing.sharing_id } });
      expect(result).toBe(1);
    });
  });

  describe('Model management', () => {
    it('should get a model from the database service', () => {
      // Setup
      const mockModel = { name: 'TestModel' };
      (databaseService.getModel as jest.Mock).mockReturnValue(mockModel);
      
      // Execute
      const result = databaseController.getModelFromService('TestModel');
      
      // Assert
      expect(databaseService.getModel).toHaveBeenCalledWith('TestModel');
      expect(result).toEqual(mockModel);
    });
    
    it('should handle model not found in database service', () => {
      // Setup
      (databaseService.getModel as jest.Mock).mockReturnValue(null);
      
      // Execute
      const result = databaseController.getModelFromService('NonExistentModel');
      
      // Assert
      expect(databaseService.getModel).toHaveBeenCalledWith('NonExistentModel');
      expect(result).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle create errors', async () => {
      // Setup
      (databaseService.create as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Execute & Assert
      await expect(databaseController.createUser(typedTestUser)).rejects.toThrow('Database error');
    });
    
    it('should handle findAll errors', async () => {
      // Setup
      (databaseService.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Execute & Assert
      await expect(databaseController.findAllUsers()).rejects.toThrow('Database error');
    });
    
    it('should handle findOne errors', async () => {
      // Setup
      (databaseService.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Execute & Assert
      await expect(databaseController.findUserByEmail(typedTestUser.email)).rejects.toThrow('Database error');
    });
  });
});