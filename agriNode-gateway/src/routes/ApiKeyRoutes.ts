import { Router } from 'express';
import ApiKeyController from '../controller/ApiKeyController';
import AuthMiddleware from '../middleware/AuthMiddleware';

const router = Router();
// Protect all routes
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       required:
 *         - api_key_id
 *         - user_id
 *         - name
 *         - key
 *         - created_at
 *       properties:
 *         api_key_id:
 *           type: string
 *         user_id:
 *           type: string
 *         name:
 *           type: string
 *         key:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: List API keys for authenticated user
 *     tags: [ApiKeys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKey'
 */
router.get('/', ApiKeyController.list);

/**
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Create a new API key for authenticated user
 *     tags: [ApiKeys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: API key created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ApiKey'
 */
router.post('/', ApiKeyController.create);

/**
 * @swagger
 * /api/api-keys/{id}:
 *   delete:
 *     summary: Delete an API key
 *     tags: [ApiKeys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key deleted
 */
router.delete('/:id', ApiKeyController.remove);

export default router;