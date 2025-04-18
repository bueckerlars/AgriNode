import AuthController from '../../src/controller/AuthController';
import AuthService from '../../src/services/AuthService';
import databaseController from '../../src/controller/DatabaseController';
import { createMockRequest, createMockResponse, testUser } from '../testHelpers';

// Mock AuthService
jest.mock('../../src/services/AuthService', () => ({
  register: jest.fn(),
  login: jest.fn(),
  refreshAccessToken: jest.fn(),
  invalidateRefreshToken: jest.fn(),
  changePassword: jest.fn()
}));

// Mock DatabaseController
jest.mock('../../src/controller/DatabaseController', () => ({
  findAllUsers: jest.fn(),
  findUserById: jest.fn()
}));

// Mock the logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Setup
      (databaseController.findAllUsers as jest.Mock).mockResolvedValue([]);
      (AuthService.register as jest.Mock).mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      });
      
      const req = createMockRequest({
        body: {
          email: 'new@example.com',
          password: 'password123',
          username: 'newuser'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.register(req as any, res as any);
      
      // Assert
      expect(AuthService.register).toHaveBeenCalledWith(
        'new@example.com', 'password123', 'newuser', 'admin'
      ); // First user should be admin
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'test-refresh-token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'test-access-token' });
    });
    
    it('should assign user role when not the first user', async () => {
      // Setup
      (databaseController.findAllUsers as jest.Mock).mockResolvedValue([testUser]); // Already one user
      (AuthService.register as jest.Mock).mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      });
      
      const req = createMockRequest({
        body: {
          email: 'second@example.com',
          password: 'password123',
          username: 'seconduser'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.register(req as any, res as any);
      
      // Assert
      expect(AuthService.register).toHaveBeenCalledWith(
        'second@example.com', 'password123', 'seconduser', 'user'
      ); // Second user should be regular user
      expect(res.status).toHaveBeenCalledWith(201);
    });
    
    it('should validate required registration fields', async () => {
      // Setup
      const req = createMockRequest({
        body: {
          email: 'missing@example.com',
          // Missing password and username
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.register(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email, password, and username are required' });
      expect(AuthService.register).not.toHaveBeenCalled();
    });
    
    it('should handle registration errors', async () => {
      // Setup
      (databaseController.findAllUsers as jest.Mock).mockResolvedValue([testUser]);
      (AuthService.register as jest.Mock).mockRejectedValue(new Error('Email already in use'));
      
      const req = createMockRequest({
        body: {
          email: 'existing@example.com',
          password: 'password123',
          username: 'existinguser'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.register(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Setup
      (AuthService.login as jest.Mock).mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      });
      
      const req = createMockRequest({
        body: {
          email: 'user@example.com',
          password: 'password123'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.login(req as any, res as any);
      
      // Assert
      expect(AuthService.login).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'test-refresh-token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'test-access-token' });
    });
    
    it('should validate required login fields', async () => {
      // Setup
      const req = createMockRequest({
        body: {
          email: 'user@example.com',
          // Missing password
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.login(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
      expect(AuthService.login).not.toHaveBeenCalled();
    });
    
    it('should handle login errors', async () => {
      // Setup
      (AuthService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
      
      const req = createMockRequest({
        body: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.login(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      // Setup
      (AuthService.refreshAccessToken as jest.Mock).mockResolvedValue({
        accessToken: 'new-access-token'
      });
      
      const req = createMockRequest({
        cookies: { refreshToken: 'valid-refresh-token' }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.refresh(req as any, res as any);
      
      // Assert
      expect(AuthService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'new-access-token' });
    });
    
    it('should validate refresh token presence', async () => {
      // Setup
      const req = createMockRequest({
        cookies: {} // No refresh token
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.refresh(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token is required' });
      expect(AuthService.refreshAccessToken).not.toHaveBeenCalled();
    });
    
    it('should handle token refresh errors', async () => {
      // Setup
      (AuthService.refreshAccessToken as jest.Mock).mockRejectedValue(new Error('Invalid refresh token'));
      
      const req = createMockRequest({
        cookies: { refreshToken: 'invalid-refresh-token' }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.refresh(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Setup
      const req = createMockRequest({
        cookies: { refreshToken: 'valid-refresh-token' }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.logout(req as any, res as any);
      
      // Assert
      expect(AuthService.invalidateRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
    
    it('should handle missing refresh token gracefully', async () => {
      // Setup
      const req = createMockRequest({
        cookies: {} // No refresh token
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.logout(req as any, res as any);
      
      // Assert
      expect(AuthService.invalidateRefreshToken).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('me', () => {
    it('should return user data successfully', async () => {
      // Setup
      const userData = {
        ...testUser,
        password: 'hashed_password' // Should be removed from response
      };
      (databaseController.findUserById as jest.Mock).mockResolvedValue(userData);
      
      const req = createMockRequest({
        user: { id: testUser.user_id }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.me(req as any, res as any);
      
      // Assert
      expect(databaseController.findUserById).toHaveBeenCalledWith(testUser.user_id);
      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.email).toBe(testUser.email);
      expect(responseData.username).toBe(testUser.username);
      expect(responseData.password).toBeUndefined(); // Password should be removed
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Setup
      const req = createMockRequest({
        // No user property - not authenticated
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.me(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
      expect(databaseController.findUserById).not.toHaveBeenCalled();
    });
    
    it('should return 404 if user data not found', async () => {
      // Setup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(null);
      
      const req = createMockRequest({
        user: { id: 'non-existent-id' }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.me(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User data not found' });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Setup
      (AuthService.changePassword as jest.Mock).mockResolvedValue(true);
      
      const req = createMockRequest({
        user: { id: testUser.user_id },
        body: {
          oldPassword: 'oldpassword',
          newPassword: 'newpassword'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.changePassword(req as any, res as any);
      
      // Assert
      expect(AuthService.changePassword).toHaveBeenCalledWith(
        testUser.user_id, 'oldpassword', 'newpassword'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
    });
    
    it('should validate required fields', async () => {
      // Setup
      const req = createMockRequest({
        user: { id: testUser.user_id },
        body: {
          oldPassword: 'oldpassword'
          // Missing newPassword
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.changePassword(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Old password and new password are required' });
      expect(AuthService.changePassword).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Setup
      const req = createMockRequest({
        // No user property - not authenticated
        body: {
          oldPassword: 'oldpassword',
          newPassword: 'newpassword'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.changePassword(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(AuthService.changePassword).not.toHaveBeenCalled();
    });
    
    it('should handle password change errors', async () => {
      // Setup
      (AuthService.changePassword as jest.Mock).mockRejectedValue(new Error('Incorrect old password'));
      
      const req = createMockRequest({
        user: { id: testUser.user_id },
        body: {
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword'
        }
      });
      const res = createMockResponse();
      
      // Execute
      await AuthController.changePassword(req as any, res as any);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect old password' });
    });
  });
});