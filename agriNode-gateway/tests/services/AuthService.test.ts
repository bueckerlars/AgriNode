import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import AuthService from '../../src/services/AuthService';
import databaseController from '../../src/controller/DatabaseController';
import { testUser } from '../testHelpers';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('../../src/controller/DatabaseController');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('uuid');

describe('AuthService', () => {
  // Extended test user with password for auth testing
  const testUserWithPassword = {
    ...testUser,
    password: 'hashed-password'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock dependencies
      (uuidv4 as jest.Mock).mockReturnValue('test-uuid');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (databaseController.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (databaseController.findAllUsers as jest.Mock).mockResolvedValue([testUser]);
      (databaseController.createUser as jest.Mock).mockResolvedValue({
        ...testUser,
        user_id: 'test-uuid',
        email: 'new@example.com',
      });
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      // Call the method
      const result = await AuthService.register('new@example.com', 'password', 'newuser', 'user');

      // Assertions
      expect(databaseController.findUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(databaseController.createUser).toHaveBeenCalledWith({
        user_id: 'test-uuid',
        email: 'new@example.com',
        password: 'hashed-password',
        username: 'newuser',
        role: 'user'
      });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('should assign admin role to first user', async () => {
      // Mock dependencies
      (uuidv4 as jest.Mock).mockReturnValue('test-uuid');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (databaseController.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (databaseController.findAllUsers as jest.Mock).mockResolvedValue([]);
      (databaseController.createUser as jest.Mock).mockResolvedValue({
        ...testUser,
        user_id: 'test-uuid',
        email: 'admin@example.com',
        role: 'admin'
      });
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      // Call the method
      await AuthService.register('admin@example.com', 'password', 'adminuser', 'user');

      // Assertions
      expect(databaseController.createUser).toHaveBeenCalledWith({
        user_id: 'test-uuid',
        email: 'admin@example.com',
        password: 'hashed-password',
        username: 'adminuser',
        role: 'admin' // Should assign admin role regardless of provided role
      });
    });

    it('should throw error if user already exists', async () => {
      // Mock dependencies
      (databaseController.findUserByEmail as jest.Mock).mockResolvedValue(testUser);

      // Call the method and expect it to throw
      await expect(
        AuthService.register('test@example.com', 'password', 'testuser', 'user')
      ).rejects.toThrow('User already exists');

      // Should not proceed with creation
      expect(databaseController.createUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      // Mock dependencies
      (databaseController.findUserByEmail as jest.Mock).mockResolvedValue(testUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      // Call the method
      const result = await AuthService.login('test@example.com', 'password');

      // Assertions
      expect(databaseController.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', testUserWithPassword.password);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('should throw error if user does not exist', async () => {
      // Mock dependencies
      (databaseController.findUserByEmail as jest.Mock).mockResolvedValue(null);

      // Call the method and expect it to throw
      await expect(
        AuthService.login('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is invalid', async () => {
      // Mock dependencies
      (databaseController.findUserByEmail as jest.Mock).mockResolvedValue(testUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Call the method and expect it to throw
      await expect(
        AuthService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Mock dependencies
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      (databaseController.updateUserPassword as jest.Mock).mockResolvedValue(undefined);

      // Call the method
      await AuthService.changePassword('test-user-id', 'oldpassword', 'newpassword');

      // Assertions
      expect(databaseController.findUserById).toHaveBeenCalledWith('test-user-id');
      expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', testUserWithPassword.password);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(databaseController.updateUserPassword).toHaveBeenCalledWith('test-user-id', 'new-hashed-password');
    });

    it('should throw error if user does not exist', async () => {
      // Mock dependencies
      (databaseController.findUserById as jest.Mock).mockResolvedValue(null);

      // Call the method and expect it to throw
      await expect(
        AuthService.changePassword('nonexistent-id', 'oldpassword', 'newpassword')
      ).rejects.toThrow('User not found');

      // Should not proceed with password update
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if old password is invalid', async () => {
      // Mock dependencies
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Call the method and expect it to throw
      await expect(
        AuthService.changePassword('test-user-id', 'wrong-oldpassword', 'newpassword')
      ).rejects.toThrow('Invalid old password');

      // Should not proceed with password update
      expect(databaseController.updateUserPassword).not.toHaveBeenCalled();
    });
  });

  describe('getUserFromToken', () => {
    it('should extract user data from valid token', () => {
      const decodedToken = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user'
      };
      
      // Mock jwt.verify
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      // Call the method
      const result = AuthService.getUserFromToken('valid-token');

      // Assertions
      expect(jwt.verify).toHaveBeenCalled();
      expect(result).toEqual(decodedToken);
    });

    it('should throw error for invalid token', () => {
      // Mock jwt.verify to throw
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Call the method and expect it to throw
      expect(() => 
        AuthService.getUserFromToken('invalid-token')
      ).toThrow('Invalid token');
    });
  });

  // Additional test for refresh token functionality
  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      // First login to set up a valid refresh token
      (databaseController.findUserByEmail as jest.Mock).mockResolvedValue(testUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('valid-refresh-token')
        .mockReturnValue('new-access-token');

      const { refreshToken } = await AuthService.login('test@example.com', 'password');

      // Reset mocks for the refresh token test
      jest.clearAllMocks();

      // Mock jwt.verify to return valid decoded token
      const mockDecodedToken = {
        sub: testUser.id,
        userId: testUser.id,
        email: testUser.email,
        type: 'refresh'
      };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      // Mock user lookup
      (databaseController.findUserById as jest.Mock).mockResolvedValue(testUser);

      // Call the refresh token method
      const result = await AuthService.refreshAccessToken(refreshToken);

      // Assertions
      expect(jwt.verify).toHaveBeenCalled();
      expect(databaseController.findUserById).toHaveBeenCalledWith(testUser.id);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role
        }),
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should throw error for invalid refresh token', async () => {
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Call with invalid token
      await expect(
        AuthService.refreshAccessToken('invalid-refresh-token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('invalidateRefreshToken', () => {
    it('should invalidate a refresh token', async () => {
      // First set up a valid token by calling login
      (databaseController.findUserByEmail as jest.Mock).mockResolvedValue(testUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      // Call login to set up refresh token
      const loginResult = await AuthService.login('test@example.com', 'password');
      const refreshToken = loginResult.refreshToken;

      // Reset mocks
      jest.clearAllMocks();

      // Now invalidate the token
      AuthService.invalidateRefreshToken(refreshToken);

      // Verify the token is now invalid by trying to use it
      await expect(
        AuthService.refreshAccessToken(refreshToken)
      ).rejects.toThrow('Invalid refresh token');
    });
  });
});