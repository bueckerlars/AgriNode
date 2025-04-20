import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import databaseController from '../controller/DatabaseController';
import { User } from '../types';
import serverConfig from '../config/serverConfig';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

// Store for refresh tokens - keeping this in memory for now
// In a production app, you should store these in a database
const refreshTokens: Map<string, { userId: string, expiresAt: Date }> = new Map();

class AuthService {
  private readonly JWT_SECRET = serverConfig.jwtSecret;
  private readonly TOKEN_EXPIRY = '15m'; // Shorter expiry for access tokens
  private readonly REFRESH_TOKEN_SECRET = serverConfig.jwtSecret + '-refresh';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  async register(email: string, password: string, username: string, role: string): Promise<{ accessToken: string, refreshToken: string }> {
    logger.info(`Registration attempt for email: ${email}`);
    
    const existingUser = await databaseController.findUserByEmail(email);
    if (existingUser) {
      logger.warn(`Registration failed: User with email ${email} already exists`);
      throw new Error('User already exists');
    }

    const allUsers = await databaseController.findAllUsers();
    let userRole = role;
    
    if (allUsers.length === 0) {
      logger.info('First user registration detected - assigning admin role');
      userRole = 'admin';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await databaseController.createUser({
      user_id: uuidv4(),
      email,
      password: hashedPassword,
      username,
      role: userRole as 'admin' | 'user'
    });

    if (!newUser) {
      logger.error(`Failed to create user with email: ${email}`);
      throw new Error('Failed to create user');
    }

    const accessToken = this.generateToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser.user_id);
    
    logger.info(`User registered successfully: ${email} with role: ${userRole}`);
    return { accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<{ accessToken: string, refreshToken: string }> {
    logger.info(`Login attempt for email: ${email}`);
    
    const user = await databaseController.findUserByEmail(email);
    if (!user) {
      logger.warn(`Login failed: User with email ${email} not found`);
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for email ${email}`);
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user.user_id);
    
    logger.info(`User logged in successfully: ${email}`);
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(token: string): Promise<{ accessToken: string }> {
    try {
      logger.debug('Attempting to refresh access token');
      
      // Verify the refresh token with the correct secret
      try {
        const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as { userId: string, type: string };
        
        if (decoded.type !== 'refresh') {
          logger.warn('Token refresh failed: Not a refresh token');
          throw new Error('Invalid refresh token');
        }

        const tokenData = refreshTokens.get(token);
        if (!tokenData) {
          logger.warn('Token refresh failed: Invalid refresh token');
          throw new Error('Invalid refresh token');
        }

        if (new Date() > tokenData.expiresAt) {
          logger.warn(`Token refresh failed: Expired refresh token for user ID: ${tokenData.userId}`);
          refreshTokens.delete(token);
          throw new Error('Refresh token expired');
        }

        const user = await databaseController.findUserById(decoded.userId);
        if (!user) {
          logger.error(`Token refresh failed: User ID ${decoded.userId} not found`);
          throw new Error('User not found');
        }

        const accessToken = this.generateToken(user);
        
        logger.info(`Access token refreshed successfully for user ID: ${user.user_id}`);
        return { accessToken };
      } catch (jwtError) {
        logger.warn(`Token verification failed: ${jwtError instanceof Error ? jwtError.message : 'Unknown error'}`);
        throw new Error('Invalid refresh token');
      }
    } catch (error) {
      logger.error(`Error refreshing access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  invalidateRefreshToken(token: string): void {
    logger.debug('Invalidating refresh token');
    refreshTokens.delete(token);
    logger.info('Refresh token invalidated successfully');
  }

  getUserFromToken(token: string): any {
    try {
      logger.debug('Decoding user from token');
      const decoded = jwt.verify(token, this.JWT_SECRET);
      logger.debug(`Token decoded successfully for user ID: ${(decoded as any).userId}`);
      return decoded;
    } catch (error) {
      logger.error(`Error decoding token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Invalid token');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    logger.info(`Password change attempt for user ID: ${userId}`);

    const user = await databaseController.findUserById(userId);
    if (!user) {
      logger.warn(`Password change failed: User ID ${userId} not found`);
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      logger.warn(`Password change failed: Invalid old password for user ID ${userId}`);
      throw new Error('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await databaseController.updateUserPassword(userId, hashedPassword);
    logger.info(`Password changed successfully for user ID: ${userId}`);
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.user_id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.TOKEN_EXPIRY });
  }

  private generateRefreshToken(userId: string): string {
    const refreshToken = jwt.sign({ 
      type: 'refresh',
      userId: userId
    }, this.REFRESH_TOKEN_SECRET, { 
      expiresIn: this.REFRESH_TOKEN_EXPIRY 
    });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    refreshTokens.set(refreshToken, { 
      userId,
      expiresAt 
    });
    
    logger.debug(`Generated refresh token for user ID: ${userId}`);
    return refreshToken;
  }
}

export default new AuthService();
