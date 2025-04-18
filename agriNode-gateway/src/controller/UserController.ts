import { Request, Response } from 'express';
import databaseController from './DatabaseController';
import logger from '../config/logger';

// Registration status - in a production environment this should be stored in the database
let isRegistrationEnabled = true;

class UserController {
  /**
   * Get all users (admin only)
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      logger.info(`Admin: Fetching all users`);
      const users = await databaseController.findAllUsers();
      
      // Format users to match Swagger spec (simple array of user objects without Sequelize metadata)
      const formattedUsers = users.map(user => {
        // Extract only the necessary user fields, excluding password
        return {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      });
      
      res.status(200).json(formattedUsers);
    } catch (error: any) {
      logger.error(`Error fetching users: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get a specific user (admin only)
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      logger.info(`Admin: Fetching user with ID ${userId}`);
      
      const user = await databaseController.findUserById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      logger.error(`Error fetching user: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a user (admin only)
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const { username, email, role, active } = req.body;
      logger.info(`Admin: Updating user with ID ${userId}`);
      
      // Check if user exists
      const userExists = await databaseController.findUserById(userId);
      if (!userExists) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Input validation
      if (email && !this.isValidEmail(email)) {
        res.status(400).json({ message: 'Invalid email address' });
        return;
      }
      
      if (role && !['admin', 'user'].includes(role)) {
        res.status(400).json({ message: 'Invalid role. Allowed values: admin, user' });
        return;
      }
      
      // Update user with WhereOptions
      const updatedData = {
        username,
        email,
        role,
        active
      };
      
      const [updateCount, updatedUsers] = await databaseController.updateUser(
        updatedData, 
        { where: { user_id: userId } }
      );
      
      if (updateCount === 0) {
        res.status(500).json({ message: 'Failed to update user' });
        return;
      }
      
      // Get updated user
      const updatedUser = await databaseController.findUserById(userId);
      if (!updatedUser) {
        res.status(500).json({ message: 'Failed to update user' });
        return;
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      logger.info(`User ${userId} successfully updated`);
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      logger.error(`Error updating user: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      logger.info(`Admin: Deleting user with ID ${userId}`);
      
      // Check if user exists
      const userExists = await databaseController.findUserById(userId);
      if (!userExists) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Check if user is trying to delete their own account
      if (req.user && req.user.user_id === userId) {
        res.status(400).json({ message: 'You cannot delete your own account' });
        return;
      }
      
      // Delete user with WhereOptions
      await databaseController.deleteUser({ where: { user_id: userId } });
      
      logger.info(`User ${userId} successfully deleted`);
      res.status(200).json({ message: 'User successfully deleted' });
    } catch (error: any) {
      logger.error(`Error deleting user: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Change registration status (admin only)
   */
  async toggleRegistrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        res.status(400).json({ message: 'Parameter "enabled" must be a boolean value' });
        return;
      }
      
      isRegistrationEnabled = enabled;
      logger.info(`Admin: Registration has been ${enabled ? 'enabled' : 'disabled'}`);
      
      res.status(200).json({ registrationEnabled: isRegistrationEnabled });
    } catch (error: any) {
      logger.error(`Error changing registration status: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get registration status
   */
  async getRegistrationStatus(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ registrationEnabled: isRegistrationEnabled });
    } catch (error: any) {
      logger.error(`Error getting registration status: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Check if registration is enabled before registration
   * This method can be used as middleware
   */
  checkRegistrationEnabled(req: Request, res: Response, next: Function): void {
    if (!isRegistrationEnabled) {
      logger.warn('Registration attempt while registration is disabled');
      res.status(403).json({ message: 'Registration of new users is currently disabled' });
      return;
    }
    next();
  }

  /**
   * Email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new UserController();