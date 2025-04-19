import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';
import databaseController from '../controller/DatabaseController';
import logger from '../config/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

class AuthMiddleware {
  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      // Check if we're dealing with Bearer token (JWT) or API key
      if (authHeader.startsWith('Bearer ')) {
        // Handle JWT authentication
        const token = authHeader.split(' ')[1];
        
        try {
          // Verify token and get user data
          const userData = AuthService.getUserFromToken(token);
          
          // Add user data to request
          req.user = userData;
          next();
        } catch (error: any) {
          logger.error(`JWT authentication error: ${error.message}`);
          res.status(401).json({ message: error.message || 'Authentication failed' });
        }
      } else if (authHeader.startsWith('ApiKey ')) {
        // Handle API key authentication
        const apiKey = authHeader.split(' ')[1];
        
        try {
          // Find the API key in the database
          const apiKeyData = await databaseController.findApiKeyByKey(apiKey);
          
          if (!apiKeyData) {
            logger.warn(`API key authentication failed: Invalid API key`);
            res.status(401).json({ message: 'Invalid API key' });
            return;
          }
          
          // Find the user for this API key
          const user = await databaseController.findUserById(apiKeyData.user_id);
          
          if (!user) {
            logger.error(`API key authentication failed: User not found for API key`);
            res.status(401).json({ message: 'Invalid API key' });
            return;
          }
          
          // Add user data to request
          req.user = {
            id: user.user_id,
            email: user.email,
            role: user.role
          };
          
          next();
        } catch (error: any) {
          logger.error(`API key authentication error: ${error.message}`);
          res.status(401).json({ message: 'Authentication failed' });
        }
      } else {
        // Unknown authentication method
        logger.warn(`Authentication failed: Unknown authentication method`);
        res.status(401).json({ message: 'Invalid authentication method' });
      }
    } catch (error: any) {
      logger.error(`Authentication error: ${error.message}`);
      res.status(401).json({ message: error.message || 'Authentication failed' });
    }
  }
}

export default new AuthMiddleware();
