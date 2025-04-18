import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import databaseController from './DatabaseController';
import logger from '../config/logger';

class ApiKeyController {
  /**
   * List all API keys for current user
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
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
      // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const userId = req.user.id;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ message: 'Name is required' });
        return;
      }
      const apiKeyId = uuidv4();
      const key = uuidv4();
      const newKey = await databaseController.createApiKey({
        api_key_id: apiKeyId,
        user_id: userId,
        name,
        key,
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
      // Überprüfen, ob ein authentifizierter Benutzer vorhanden ist
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const userId = req.user.id;
      const { id } = req.params;
      // ensure belongs to user
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