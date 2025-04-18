import express from 'express';
import UserController from '../controller/UserController';
import AuthMiddleware from '../middleware/AuthMiddleware';
import UserRoleMiddleware from '../middleware/UserRoleMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  UserRoleMiddleware.checkRole('admin'),
  UserController.getAllUsers
);

/**
 * @swagger
 * /api/users/registration-status:
 *   get:
 *     summary: Get registration status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current registration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registrationEnabled:
 *                   type: boolean
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
router.get(
  '/registration-status',
  AuthMiddleware.authenticate,
  UserRoleMiddleware.checkRole('admin'),
  UserController.getRegistrationStatus
);

/**
 * @swagger
 * /api/users/registration-status:
 *   post:
 *     summary: Change registration status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Registration status successfully changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registrationEnabled:
 *                   type: boolean
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
router.post(
  '/registration-status',
  AuthMiddleware.authenticate,
  UserRoleMiddleware.checkRole('admin'),
  UserController.toggleRegistrationStatus
);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: User not found
 */
router.get(
  '/:userId',
  AuthMiddleware.authenticate,
  UserRoleMiddleware.checkRole('admin'),
  UserController.getUserById
);

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: User not found
 */
router.put(
  '/:userId',
  AuthMiddleware.authenticate,
  UserRoleMiddleware.checkRole('admin'),
  UserController.updateUser
);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Error (e.g. attempt to delete own account)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: User not found
 */
router.delete(
  '/:userId',
  AuthMiddleware.authenticate,
  UserRoleMiddleware.checkRole('admin'),
  UserController.deleteUser
);

export default router;