import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import databaseController from './DatabaseController';
import logger from '../config/logger';
import apiKeyService from '../services/ApiKeyService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
      res.status(200).json({ data: keys });
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

      const newKey = await apiKeyService.createApiKey(userId, name, expiresIn);
      res.status(201).json({
        success: true,
        message: 'API key created successfully',
        data: newKey
      });
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
      const keyId = req.params.id;

      // First check if the key exists and belongs to the user
      const key = await apiKeyService.findApiKeyById(keyId);
      if (!key || key.user_id !== userId) {
        res.status(404).json({ message: 'API key not found' });
        return;
      }

      await apiKeyService.deleteApiKey({ api_key_id: keyId });
      res.status(200).json({ message: 'API key deleted' });
    } catch (error: any) {
      logger.error(`Error deleting API key: ${error.message}`);
      res.status(500).json({ message: 'Failed to delete API key' });
    }
  }
}

export default new ApiKeyController();