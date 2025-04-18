import UserController from '../../src/controller/UserController';
import databaseController from '../../src/controller/DatabaseController';
import { createMockRequest, createMockResponse, testUser, testAdmin } from '../testHelpers';

// Mock the database controller
jest.mock('../../src/controller/DatabaseController', () => ({
  findAllUsers: jest.fn(),
  findUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn()
}));

// Mock the logger to prevent console logging during tests
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      // Setup
      const mockUsers = [testUser, testAdmin];
      (databaseController.findAllUsers as jest.Mock).mockResolvedValue(mockUsers);
      
      const req = createMockRequest({
        user: testAdmin // Füge Admin-Benutzer hinzu für die Authentifizierungsprüfung
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.getAllUsers(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const jsonData = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonData).toHaveLength(2);
      expect(jsonData[0].user_id).toBe(testUser.user_id);
      expect(jsonData[0].password).toBeUndefined(); // Password should not be returned
    });
    
    it('should handle database error gracefully', async () => {
      // Setup
      (databaseController.findAllUsers as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const req = createMockRequest({
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.getAllUsers(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getUserById', () => {
    it('should return a specific user successfully', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue({
        ...testUser,
        password: 'hashed_password'
      });
      
      const req = createMockRequest({
        params: { userId: testUser.user_id },
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.getUserById(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const jsonData = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonData.user_id).toBe(testUser.user_id);
      expect(jsonData.password).toBeUndefined(); // Password should not be returned
    });
    
    it('should return 404 if user not found', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(null);
      
      const req = createMockRequest({
        params: { userId: 'non-existent-id' },
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.getUserById(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
    
    it('should handle database error gracefully', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const req = createMockRequest({
        params: { userId: testUser.user_id },
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.getUserById(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('updateUser', () => {
    const updateData = {
      username: 'updatedUsername',
      email: 'updated@example.com',
      role: 'admin'
    };

    it('should update user successfully', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testUser);
      (databaseController.updateUser as jest.Mock).mockResolvedValue([1, [testUser]]);
      const updatedUser = {
        ...testUser,
        ...updateData,
        password: 'hashed_password'
      };
      (databaseController.findUserById as jest.Mock).mockResolvedValueOnce(testUser)
        .mockResolvedValueOnce(updatedUser);
      
      const req = createMockRequest({
        params: { userId: testUser.user_id },
        body: updateData,
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.updateUser(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const jsonData = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonData.username).toBe(updateData.username);
      expect(jsonData.email).toBe(updateData.email);
      expect(jsonData.password).toBeUndefined(); // Password should not be returned
    });
    
    it('should return 404 if user not found', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(null);
      
      const req = createMockRequest({
        params: { userId: 'non-existent-id' },
        body: updateData,
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.updateUser(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
    
    it('should validate email format', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testUser);
      
      const req = createMockRequest({
        params: { userId: testUser.user_id },
        body: { email: 'invalid-email' },
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.updateUser(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email address' });
    });
    
    it('should validate role values', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testUser);
      
      const req = createMockRequest({
        params: { userId: testUser.user_id },
        body: { role: 'superadmin' }, // Invalid role
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.updateUser(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid role. Allowed values: admin, user' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testUser);
      (databaseController.deleteUser as jest.Mock).mockResolvedValue(1);
      
      const req = createMockRequest({
        params: { userId: testUser.user_id },
        user: testAdmin // Logged in as admin
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.deleteUser(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'User successfully deleted' });
    });
    
    it('should return 404 if user not found', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(null);
      
      const req = createMockRequest({
        params: { userId: 'non-existent-id' },
        user: testAdmin
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.deleteUser(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
    
    it('should prevent users from deleting themselves', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testUser);
      
      const req = createMockRequest({
        params: { userId: testUser.user_id },
        user: { ...testUser } // Same user trying to delete themselves
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.deleteUser(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'You cannot delete your own account' });
    });
  });
  
  describe('toggleRegistrationStatus', () => {
    it('should enable registration', async () => {
      // Setup
      const req = createMockRequest({
        body: { enabled: true },
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.toggleRegistrationStatus(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ registrationEnabled: true });
    });
    
    it('should disable registration', async () => {
      // Setup
      const req = createMockRequest({
        body: { enabled: false },
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.toggleRegistrationStatus(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ registrationEnabled: false });
    });
    
    it('should validate input parameter type', async () => {
      // Setup
      const req = createMockRequest({
        body: { enabled: 'not-a-boolean' },
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.toggleRegistrationStatus(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Parameter "enabled" must be a boolean value' });
    });
  });
  
  describe('getRegistrationStatus', () => {
    it('should return registration status', async () => {
      // Setup
      // First set a status we know
      const setReq = createMockRequest({
        body: { enabled: true },
        user: testAdmin // Authentifizierter Benutzer
      });
      const setRes = createMockResponse();
      await UserController.toggleRegistrationStatus(setReq as any, setRes as any);
      
      // Now get the status
      const req = createMockRequest({
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      
      // Execute
      await UserController.getRegistrationStatus(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ registrationEnabled: true });
    });
  });
  
  describe('checkRegistrationEnabled', () => {
    it('should call next() when registration is enabled', async () => {
      // Setup - first enable registration
      const setReq = createMockRequest({
        body: { enabled: true },
        user: testAdmin // Authentifizierter Benutzer
      });
      const setRes = createMockResponse();
      await UserController.toggleRegistrationStatus(setReq as any, setRes as any);
      
      // Now test middleware
      const req = createMockRequest({
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      const next = jest.fn();
      
      // Execute
      UserController.checkRegistrationEnabled(req as any, res as any, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should return 403 when registration is disabled', async () => {
      // Setup - first disable registration
      const setReq = createMockRequest({
        body: { enabled: false },
        user: testAdmin // Authentifizierter Benutzer
      });
      const setRes = createMockResponse();
      await UserController.toggleRegistrationStatus(setReq as any, setRes as any);
      
      // Now test middleware
      const req = createMockRequest({
        user: testAdmin // Authentifizierter Benutzer
      });
      const res = createMockResponse();
      const next = jest.fn();
      
      // Execute
      UserController.checkRegistrationEnabled(req as any, res as any, next);
      
      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Registration of new users is currently disabled' });
    });
  });
});