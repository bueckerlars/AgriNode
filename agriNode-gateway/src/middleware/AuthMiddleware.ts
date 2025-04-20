import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import serverConfig from '../config/serverConfig';
import databaseController from '../controller/DatabaseController';
import logger from '../config/logger';

const JWT_SECRET = serverConfig.jwtSecret;
const REFRESH_TOKEN_SECRET = JWT_SECRET + '-refresh';

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
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        logger.warn('Authentication failed: No authorization header');
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const [type, token] = authHeader.split(' ');

      if (type.toLowerCase() !== 'bearer') {
        logger.warn(`Authentication failed: Invalid authorization type: ${type}`);
        res.status(401).json({ message: 'Invalid authorization type' });
        return;
      }

      try {
        // Try to decode the token
        const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string; userId: string; email: string; role: string; type?: string };

        // If it's an API key token, validate it differently
        if (decoded.type === 'apikey') {
          // API Keys use 'sub' for the key ID
          const apiKeyId = decoded.sub;
          if (!apiKeyId) {
            logger.warn('API key authentication failed: Missing key ID');
            res.status(401).json({ message: 'Invalid API key' });
            return;
          }

          const apiKey = await databaseController.findApiKeyById(apiKeyId);
          
          if (!apiKey) {
            logger.warn(`API key authentication failed: Invalid API key ID ${apiKeyId}`);
            res.status(401).json({ message: 'Invalid API key' });
            return;
          }

          // Check if the API key is expired
          if (apiKey.expiration_date && new Date(apiKey.expiration_date) < new Date()) {
            logger.warn(`API key authentication failed: Expired API key ${apiKeyId}`);
            res.status(401).json({ message: 'API key has expired' });
            return;
          }

          // Find the user for this API key
          const user = await databaseController.findUserById(decoded.userId);
          
          if (!user) {
            logger.error(`API key authentication failed: User not found for API key ${apiKeyId}`);
            res.status(401).json({ message: 'Invalid API key' });
            return;
          }

          // Add user data to request
          req.user = {
            id: user.user_id,
            email: user.email,
            role: user.role
          };
        } else {
          // Regular JWT token
          const user = await databaseController.findUserById(decoded.userId);
          
          if (!user) {
            logger.warn('Authentication failed: User not found');
            res.status(401).json({ message: 'Authentication failed' });
            return;
          }

          req.user = {
            id: user.user_id,
            email: user.email,
            role: user.role
          };
        }

        next();
      } catch (error) {
        logger.warn(`Token verification failed: ${error instanceof Error ? error.message : String(error)}`);
        res.status(401).json({ message: 'Invalid token' });
        return;
      }
    } catch (error) {
      logger.error(`Authentication error: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: 'Internal server error during authentication' });
    }
  }
}

export default new AuthMiddleware();
