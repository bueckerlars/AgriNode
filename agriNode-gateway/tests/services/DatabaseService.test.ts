import { Sequelize, Model, ModelStatic } from 'sequelize';
import { databaseService } from '../../src/services/DatabaseService';
import initModels from '../../src/models';

// Mock Sequelize and related functionalities
jest.mock('sequelize');
jest.mock('../../src/models');
jest.mock('../../src/config/logger');

describe('DatabaseService', () => {
  let mockSequelize: jest.Mocked<Sequelize>;
  let mockModel: jest.Mocked<ModelStatic<Model>>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock Sequelize instance
    mockSequelize = (databaseService as any).sequelize as jest.Mocked<Sequelize>;
    mockModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    } as unknown as jest.Mocked<ModelStatic<Model>>;
    
    // Reset the model map
    (databaseService as any).models = new Map();
  });

  describe('connect', () => {
    it('should establish database connection successfully', async () => {
      mockSequelize.authenticate = jest.fn().mockResolvedValue(undefined);
      
      const result = await databaseService.connect();
      
      expect(result).toBe(true);
      expect(mockSequelize.authenticate).toHaveBeenCalled();
      expect((databaseService as any).isConnected).toBe(true);
    });

    it('should handle connection failure', async () => {
      mockSequelize.authenticate = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      const result = await databaseService.connect();
      
      expect(result).toBe(false);
      expect(mockSequelize.authenticate).toHaveBeenCalled();
      expect((databaseService as any).isConnected).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should close the database connection when connected', async () => {
      (databaseService as any).isConnected = true;
      mockSequelize.close = jest.fn().mockResolvedValue(undefined);
      
      await databaseService.disconnect();
      
      expect(mockSequelize.close).toHaveBeenCalled();
      expect((databaseService as any).isConnected).toBe(false);
    });

    it('should not attempt to close if not connected', async () => {
      (databaseService as any).isConnected = false;
      mockSequelize.close = jest.fn();
      
      await databaseService.disconnect();
      
      expect(mockSequelize.close).not.toHaveBeenCalled();
    });
  });

  describe('getSequelize', () => {
    it('should return the sequelize instance', () => {
      expect(databaseService.getSequelize()).toBe(mockSequelize);
    });
  });

  describe('model registration and retrieval', () => {
    it('should register and retrieve models', () => {
      databaseService.registerModel('TestModel', mockModel);
      
      const retrievedModel = databaseService.getModel('TestModel');
      
      expect(retrievedModel).toBe(mockModel);
    });

    it('should return undefined for unregistered model', () => {
      const retrievedModel = databaseService.getModel('UnknownModel');
      
      expect(retrievedModel).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const testData = { name: 'Test' };
      const expectedResult = { id: 1, name: 'Test' };
      
      databaseService.registerModel('TestModel', mockModel);
      mockModel.create.mockResolvedValue(expectedResult as unknown as Model);
      
      const result = await databaseService.create('TestModel', testData);
      
      expect(mockModel.create).toHaveBeenCalledWith(testData);
      expect(result).toEqual(expectedResult);
    });

    it('should return null for unregistered model', async () => {
      const result = await databaseService.create('UnknownModel', {});
      
      expect(result).toBeNull();
      expect(mockModel.create).not.toHaveBeenCalled();
    });

    it('should propagate errors from create operation', async () => {
      databaseService.registerModel('TestModel', mockModel);
      mockModel.create.mockRejectedValue(new Error('Create error'));
      
      await expect(databaseService.create('TestModel', {})).rejects.toThrow('Create error');
    });
  });

  describe('findAll', () => {
    it('should find all records matching criteria', async () => {
      const testOptions = { where: { status: 'active' } };
      const expectedResults = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
      
      databaseService.registerModel('TestModel', mockModel);
      mockModel.findAll.mockResolvedValue(expectedResults as unknown as Model[]);
      
      const results = await databaseService.findAll('TestModel', testOptions);
      
      expect(mockModel.findAll).toHaveBeenCalledWith(testOptions);
      expect(results).toEqual(expectedResults);
    });

    it('should return empty array for unregistered model', async () => {
      const results = await databaseService.findAll('UnknownModel');
      
      expect(results).toEqual([]);
      expect(mockModel.findAll).not.toHaveBeenCalled();
    });

    it('should propagate errors from findAll operation', async () => {
      databaseService.registerModel('TestModel', mockModel);
      mockModel.findAll.mockRejectedValue(new Error('Find error'));
      
      await expect(databaseService.findAll('TestModel')).rejects.toThrow('Find error');
    });
  });

  describe('findByPk', () => {
    it('should find a record by primary key', async () => {
      const testId = 1;
      const expectedResult = { id: testId, name: 'Test' };
      
      databaseService.registerModel('TestModel', mockModel);
      mockModel.findByPk.mockResolvedValue(expectedResult as unknown as Model);
      
      const result = await databaseService.findByPk('TestModel', testId);
      
      expect(mockModel.findByPk).toHaveBeenCalledWith(testId);
      expect(result).toEqual(expectedResult);
    });

    it('should return null for unregistered model', async () => {
      const result = await databaseService.findByPk('UnknownModel', 1);
      
      expect(result).toBeNull();
      expect(mockModel.findByPk).not.toHaveBeenCalled();
    });

    it('should propagate errors from findByPk operation', async () => {
      databaseService.registerModel('TestModel', mockModel);
      mockModel.findByPk.mockRejectedValue(new Error('Find error'));
      
      await expect(databaseService.findByPk('TestModel', 1)).rejects.toThrow('Find error');
    });
  });

  describe('findOne', () => {
    it('should find a single record matching criteria', async () => {
      const testOptions = { where: { name: 'Test' } };
      const expectedResult = { id: 1, name: 'Test' };
      
      databaseService.registerModel('TestModel', mockModel);
      mockModel.findOne.mockResolvedValue(expectedResult as unknown as Model);
      
      const result = await databaseService.findOne('TestModel', testOptions);
      
      expect(mockModel.findOne).toHaveBeenCalledWith(testOptions);
      expect(result).toEqual(expectedResult);
    });

    it('should return null for unregistered model', async () => {
      const result = await databaseService.findOne('UnknownModel', {});
      
      expect(result).toBeNull();
      expect(mockModel.findOne).not.toHaveBeenCalled();
    });

    it('should propagate errors from findOne operation', async () => {
      databaseService.registerModel('TestModel', mockModel);
      mockModel.findOne.mockRejectedValue(new Error('Find error'));
      
      await expect(databaseService.findOne('TestModel', {})).rejects.toThrow('Find error');
    });
  });

  describe('update', () => {
    it('should update records matching criteria', async () => {
      const testData = { status: 'inactive' };
      const testWhere = { id: 1 };
      const expectedResult = [1]; // Just return affected count, not the updated records
      
      databaseService.registerModel('TestModel', mockModel);
      mockModel.update.mockResolvedValue(expectedResult as unknown as [number]);
      
      const result = await databaseService.update('TestModel', testData, testWhere);
      
      expect(mockModel.update).toHaveBeenCalledWith(testData, { where: testWhere, returning: true });
      expect(result).toEqual(expectedResult);
    });

    it('should return [0, []] for unregistered model', async () => {
      const result = await databaseService.update('UnknownModel', {}, {});
      
      expect(result).toEqual([0, []]);
      expect(mockModel.update).not.toHaveBeenCalled();
    });

    it('should propagate errors from update operation', async () => {
      databaseService.registerModel('TestModel', mockModel);
      mockModel.update.mockRejectedValue(new Error('Update error'));
      
      await expect(databaseService.update('TestModel', {}, {})).rejects.toThrow('Update error');
    });
  });

  describe('destroy', () => {
    it('should destroy records matching criteria', async () => {
      const testWhere = { id: 1 };
      
      databaseService.registerModel('TestModel', mockModel);
      mockModel.destroy.mockResolvedValue(1);
      
      const result = await databaseService.destroy('TestModel', testWhere);
      
      expect(mockModel.destroy).toHaveBeenCalledWith({ where: testWhere });
      expect(result).toBe(1);
    });

    it('should return 0 for unregistered model', async () => {
      const result = await databaseService.destroy('UnknownModel', {});
      
      expect(result).toBe(0);
      expect(mockModel.destroy).not.toHaveBeenCalled();
    });

    it('should propagate errors from destroy operation', async () => {
      databaseService.registerModel('TestModel', mockModel);
      mockModel.destroy.mockRejectedValue(new Error('Destroy error'));
      
      await expect(databaseService.destroy('TestModel', {})).rejects.toThrow('Destroy error');
    });
  });

  describe('transaction', () => {
    it('should execute callback within a transaction', async () => {
      const mockTransaction = {};
      const mockCallback = jest.fn().mockResolvedValue('result');
      
      mockSequelize.transaction = jest.fn().mockImplementation(async (cb) => cb(mockTransaction));
      
      const result = await databaseService.transaction(mockCallback);
      
      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(mockTransaction);
      expect(result).toBe('result');
    });

    it('should propagate errors from transaction', async () => {
      mockSequelize.transaction = jest.fn().mockRejectedValue(new Error('Transaction error'));
      
      await expect(databaseService.transaction(() => Promise.resolve())).rejects.toThrow('Transaction error');
    });
  });

  describe('query', () => {
    it('should execute raw SQL query', async () => {
      const testSql = 'SELECT * FROM users';
      const testOptions = { type: 'SELECT' };
      const expectedResult = [{ id: 1, name: 'Test' }];
      
      mockSequelize.query = jest.fn().mockResolvedValue(expectedResult);
      
      const result = await databaseService.query(testSql, testOptions);
      
      expect(mockSequelize.query).toHaveBeenCalledWith(testSql, testOptions);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from query operation', async () => {
      mockSequelize.query = jest.fn().mockRejectedValue(new Error('Query error'));
      
      await expect(databaseService.query('SELECT 1')).rejects.toThrow('Query error');
    });
  });

  describe('syncModels', () => {
    it('should sync models with the database', async () => {
      mockSequelize.sync = jest.fn().mockResolvedValue({});
      
      await databaseService.syncModels();
      
      expect(initModels).toHaveBeenCalledWith(mockSequelize);
      expect(mockSequelize.sync).toHaveBeenCalledWith({ force: false });
    });

    it('should sync with force option when specified', async () => {
      mockSequelize.sync = jest.fn().mockResolvedValue({});
      
      await databaseService.syncModels(true);
      
      expect(mockSequelize.sync).toHaveBeenCalledWith({ force: true });
    });

    it('should propagate errors from sync operation', async () => {
      mockSequelize.sync = jest.fn().mockRejectedValue(new Error('Sync error'));
      
      await expect(databaseService.syncModels()).rejects.toThrow('Sync error');
    });
  });
});