import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import databaseController from '../controller/DatabaseController';
import { ApiKey } from '../types/ApiKey';
import logger from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class ApiKeyService {
  async createApiKey(userId: string, name: string, expiresIn?: number): Promise<ApiKey> {
    try {
      logger.info(`Creating API key for user ${userId} with name: ${name}`);
      
      const apiKeyId = uuidv4();
      
      // Calculate expiration date if provided
      let expirationDate: Date | null = null;
      if (expiresIn) {
        expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(expiresIn.toString()));
      }

      // Generate JWT token as the key
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
        throw new Error('Failed to create API key');
      }

      logger.info(`API key created successfully for user ${userId}`);
      return newKey;
    } catch (error) {
      logger.error(`Error creating API key: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findApiKeysByUser(userId: string): Promise<ApiKey[]> {
    try {
      logger.info(`Finding API keys for user ${userId}`);
      const keys = await databaseController.findApiKeysByUser(userId);
      
      // Filter out expired keys
      const now = new Date();
      const validKeys = keys.filter(key => !key.expiration_date || key.expiration_date > now);
      
      logger.info(`Found ${validKeys.length} valid API keys for user ${userId}`);
      return validKeys;
    } catch (error) {
      logger.error(`Error finding API keys: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findApiKeyById(keyId: string): Promise<ApiKey | null> {
    try {
      logger.info(`Finding API key by ID: ${keyId}`);
      return await databaseController.findApiKeyById(keyId);
    } catch (error) {
      logger.error(`Error finding API key: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async deleteApiKey(where: { api_key_id: string }): Promise<number> {
    try {
      logger.info(`Deleting API key: ${where.api_key_id}`);
      const deleteCount = await databaseController.deleteApiKey(where);
      logger.info(`API key deleted successfully: ${where.api_key_id}`);
      return deleteCount;
    } catch (error) {
      logger.error(`Error deleting API key: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

export default new ApiKeyService();