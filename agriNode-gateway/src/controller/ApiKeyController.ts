import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import databaseController from './DatabaseController';
import logger from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be in environment variables

class ApiKeyController {
  /**
   * List all API keys for current user
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const userId = req.user.id;
      const keys = await databaseController.findApiKeysByUser(userId);
      
      // Filter out expired keys
      const now = new Date();
      const validKeys = keys.filter(key => !key.expiration_date || key.expiration_date > now);
      
      res.status(200).json({ data: validKeys });
    } catch (error: any) {
      logger.error(`Error listing API keys: ${error.message}`);
      res.status(500).json({ message: 'Failed to retrieve API keys' });
    }
  }

  /**
   * Create a new API key
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const userId = req.user.id;
      const { name, expiresIn } = req.body;
      
      if (!name) {
        res.status(400).json({ message: 'Name is required' });
        return;
      }

      const apiKeyId = uuidv4();
      
      // Calculate expiration date if provided
      let expirationDate: Date | null = null;
      if (expiresIn) {
        expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(expiresIn));
      }

      // Generate JWT token
      const payload = {
        sub: apiKeyId,
        userId: userId,
        type: 'apikey'
      };

      const key = jwt.sign(payload, JWT_SECRET, {
        expiresIn: expiresIn || '100y' // Default to 100 years if no expiration provided
      });

      const newKey = await databaseController.createApiKey({
        api_key_id: apiKeyId,
        user_id: userId,
        name,
        key,
        expiration_date: expirationDate
      });

      if (!newKey) {
        throw new Error('Creation failed');
      }

      res.status(201).json({ data: newKey });
    } catch (error: any) {
      logger.error(`Error creating API key: ${error.message}`);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  }

  /**
   * Delete an API key
   */
  async remove(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const userId = req.user.id;
      const { id } = req.params;
      
      const key = await databaseController.findApiKeyById(id);
      if (!key || key.user_id !== userId) {
        res.status(404).json({ message: 'API key not found' });
        return;
      }

      await databaseController.deleteApiKey({ api_key_id: id });
      res.status(200).json({ message: 'API key deleted' });
    } catch (error: any) {
      logger.error(`Error deleting API key: ${error.message}`);
      res.status(500).json({ message: 'Failed to delete API key' });
    }
  }
}

export default new ApiKeyController();