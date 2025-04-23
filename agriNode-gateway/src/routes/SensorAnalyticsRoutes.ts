import { Router } from 'express';
import SensorAnalyticsController from '../controller/SensorAnalyticsController';
import AuthMiddleware from '../middleware/AuthMiddleware';

const router = Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalysisStatus:
 *       type: string
 *       enum: [pending, processing, completed, failed]
 *       description: Status of a sensor analytics job
 * 
 *     AnalysisType:
 *       type: string
 *       enum: [trend, anomaly, forecast]
 *       description: Type of analysis to perform on sensor data
 * 
 *     TimeRange:
 *       type: object
 *       required:
 *         - start
 *         - end
 *       properties:
 *         start:
 *           type: string
 *           format: date-time
 *           description: Start time of the analysis period
 *         end:
 *           type: string
 *           format: date-time
 *           description: End time of the analysis period
 * 
 *     SensorAnalytics:
 *       type: object
 *       properties:
 *         analytics_id:
 *           type: string
 *           description: Unique identifier for the analytics entry
 *         sensor_id:
 *           type: string
 *           description: ID of the sensor being analyzed
 *         user_id:
 *           type: string
 *           description: ID of the user who created the analysis
 *         status:
 *           $ref: '#/components/schemas/AnalysisStatus'
 *         type:
 *           $ref: '#/components/schemas/AnalysisType'
 *         parameters:
 *           type: object
 *           properties:
 *             timeRange:
 *               $ref: '#/components/schemas/TimeRange'
 *           description: Parameters for the analysis
 *         result:
 *           type: object
 *           description: Result of the completed analysis
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the analytics entry was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: When the analytics entry was last updated
 */

/**
 * @swagger
 * /api/analytics:
 *   post:
 *     summary: Create a new analytics entry
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sensor_id
 *               - type
 *               - parameters
 *             properties:
 *               sensor_id:
 *                 type: string
 *                 description: ID of the sensor to analyze
 *               type:
 *                 $ref: '#/components/schemas/AnalysisType'
 *               parameters:
 *                 type: object
 *                 required:
 *                   - timeRange
 *                 properties:
 *                   timeRange:
 *                     $ref: '#/components/schemas/TimeRange'
 *     responses:
 *       201:
 *         description: Analytics entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SensorAnalytics'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Sensor not found or access denied
 *       500:
 *         description: Server error
 */
router.post('/', SensorAnalyticsController.createAnalytics);

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get all analytics entries for the current user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of analytics entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorAnalytics'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', SensorAnalyticsController.getUserAnalytics);

/**
 * @swagger
 * /api/analytics/{analytics_id}:
 *   get:
 *     summary: Get analytics entry by ID
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analytics_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics entry details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SensorAnalytics'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Analytics entry not found
 *       500:
 *         description: Server error
 */
router.get('/:analytics_id', SensorAnalyticsController.getAnalyticsById);

/**
 * @swagger
 * /api/analytics/sensor/{sensor_id}:
 *   get:
 *     summary: Get all analytics entries for a specific sensor
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensor_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of analytics entries for the sensor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorAnalytics'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/sensor/:sensor_id', SensorAnalyticsController.getSensorAnalytics);

/**
 * @swagger
 * /api/analytics/{analytics_id}:
 *   delete:
 *     summary: Delete an analytics entry
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analytics_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Analytics deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Analytics entry not found
 *       500:
 *         description: Server error
 */
router.delete('/:analytics_id', SensorAnalyticsController.deleteAnalytics);

export default router;