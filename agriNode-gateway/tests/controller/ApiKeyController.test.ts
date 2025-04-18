import ApiKeyController from '../../src/controller/ApiKeyController';
import databaseController from '../../src/controller/DatabaseController';
import { createMockRequest, createMockResponse, testUser } from '../testHelpers';

// Mock UUID generation to make testing predictable
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

// Mock database controller
jest.mock('../../src/controller/DatabaseController', () => ({
  findApiKeysByUser: jest.fn(),
  findApiKeyById: jest.fn(),
  createApiKey: jest.fn(),
  deleteApiKey: jest.fn()
}));

// Mock the logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('ApiKeyController', () => {
  const testApiKey = {
    api_key_id: 'test-api-key-id',
    user_id: testUser.id,
    name: 'Test API Key',
    key: 'test-api-key-value',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return 401 if no user is authenticated', async () => {
      // Setup
      const req = createMockRequest({
        user: null // No authenticated user
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.list(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(databaseController.findApiKeysByUser).not.toHaveBeenCalled();
    });

    it('should list all API keys for the current user', async () => {
      // Setup
      (databaseController.findApiKeysByUser as jest.Mock).mockResolvedValue([testApiKey]);
      
      const req = createMockRequest({
        user: { id: testUser.id }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.list(req as any, res as any);
      
      // Assert
      expect(databaseController.findApiKeysByUser).toHaveBeenCalledWith(testUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: [testApiKey] });
    });
    
    it('should handle errors when listing API keys', async () => {
      // Setup
      (databaseController.findApiKeysByUser as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const req = createMockRequest({
        user: { id: testUser.id }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.list(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to retrieve API keys' });
    });
  });

  describe('create', () => {
    it('should return 401 if no user is authenticated', async () => {
      // Setup
      const req = createMockRequest({
        user: null, // No authenticated user
        body: { name: 'New API Key' }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.create(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(databaseController.createApiKey).not.toHaveBeenCalled();
    });

    it('should create a new API key successfully', async () => {
      // Setup
      (databaseController.createApiKey as jest.Mock).mockResolvedValue(testApiKey);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        body: { name: 'New API Key' }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.create(req as any, res as any);
      
      // Assert
      expect(databaseController.createApiKey).toHaveBeenCalledWith({
        api_key_id: 'test-uuid',
        user_id: testUser.id,
        name: 'New API Key',
        key: 'test-uuid'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ data: testApiKey });
    });
    
    it('should validate required fields for API key creation', async () => {
      // Setup
      const req = createMockRequest({
        user: { id: testUser.id },
        body: {} // Missing name
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.create(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Name is required' });
      expect(databaseController.createApiKey).not.toHaveBeenCalled();
    });
    
    it('should handle errors during API key creation', async () => {
      // Setup
      (databaseController.createApiKey as jest.Mock).mockImplementation(() => {
        throw new Error('Creation failed');
      });
      
      const req = createMockRequest({
        user: { id: testUser.id },
        body: { name: 'New API Key' }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.create(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create API key' });
    });
  });

  describe('remove', () => {
    it('should return 401 if no user is authenticated', async () => {
      // Setup
      const req = createMockRequest({
        user: null, // No authenticated user
        params: { id: testApiKey.api_key_id }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.remove(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(databaseController.findApiKeyById).not.toHaveBeenCalled();
      expect(databaseController.deleteApiKey).not.toHaveBeenCalled();
    });

    it('should delete an API key successfully', async () => {
      // Setup
      (databaseController.findApiKeyById as jest.Mock).mockResolvedValue(testApiKey);
      (databaseController.deleteApiKey as jest.Mock).mockResolvedValue(1);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { id: testApiKey.api_key_id }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.remove(req as any, res as any);
      
      // Assert
      expect(databaseController.findApiKeyById).toHaveBeenCalledWith(testApiKey.api_key_id);
      expect(databaseController.deleteApiKey).toHaveBeenCalledWith({ api_key_id: testApiKey.api_key_id });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'API key deleted' });
    });
    
    it('should return 404 if API key not found', async () => {
      // Setup
      (databaseController.findApiKeyById as jest.Mock).mockResolvedValue(null);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { id: 'non-existent-id' }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.remove(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'API key not found' });
      expect(databaseController.deleteApiKey).not.toHaveBeenCalled();
    });
    
    it('should prevent deleting API keys owned by other users', async () => {
      // Setup
      const otherUsersApiKey = {
        ...testApiKey,
        user_id: 'other-user-id'
      };
      
      (databaseController.findApiKeyById as jest.Mock).mockResolvedValue(otherUsersApiKey);
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { id: otherUsersApiKey.api_key_id }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.remove(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'API key not found' });
      expect(databaseController.deleteApiKey).not.toHaveBeenCalled();
    });
    
    it('should handle errors during API key deletion', async () => {
      // Setup
      (databaseController.findApiKeyById as jest.Mock).mockResolvedValue(testApiKey);
      (databaseController.deleteApiKey as jest.Mock).mockRejectedValue(new Error('Deletion error'));
      
      const req = createMockRequest({
        user: { id: testUser.id },
        params: { id: testApiKey.api_key_id }
      });
      const res = createMockResponse();
      
      // Execute
      await ApiKeyController.remove(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to delete API key' });
    });
  });
});