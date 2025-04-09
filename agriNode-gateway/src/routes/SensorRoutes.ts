import { Router } from 'express';
import SensorController from '../controller/SensorController';
import AuthMiddleware from '../middleware/AuthMiddleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Sensor:
 *       type: object
 *       required:
 *         - sensor_id
 *         - user_id
 *         - name
 *         - unique_device_id
 *         - registered_at
 *         - updated_at
 *       properties:
 *         sensor_id:
 *           type: string
 *           description: Unique identifier for the sensor
 *         user_id:
 *           type: string
 *           description: ID of the user who owns the sensor
 *         name:
 *           type: string
 *           description: Name of the sensor
 *         description:
 *           type: string
 *           description: Optional description of the sensor
 *         unique_device_id:
 *           type: string
 *           description: Unique device ID for hardware identification
 *         registered_at:
 *           type: string
 *           format: date-time
 *           description: Date when the sensor was registered
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Date when the sensor was last updated
 */

/**
 * @swagger
 * tags:
 *   name: Sensors
 *   description: Sensor management API
 */

// All sensor routes need authentication
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/sensors:
 *   get:
 *     summary: Get all sensors for the authenticated user
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of sensors for the authenticated user
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
 *                     $ref: '#/components/schemas/Sensor'
 *       401:
 *         description: Unauthorized, authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/', SensorController.getUserSensors);

/**
 * @swagger
 * /api/sensors/register:
 *   post:
 *     summary: Register a new sensor
 *     tags: [Sensors]
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
 *               - unique_device_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the sensor
 *               description:
 *                 type: string
 *                 description: Optional description of the sensor
 *               unique_device_id:
 *                 type: string
 *                 description: Unique device ID for hardware identification
 *     responses:
 *       201:
 *         description: Sensor registered successfully
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
 *                   example: Sensor registered successfully
 *                 data:
 *                   $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Bad request, missing required fields
 *       401:
 *         description: Unauthorized, authentication required
 *       409:
 *         description: Conflict, sensor with this device ID already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register', SensorController.registerSensor);

/**
 * @swagger
 * /api/sensors/{sensorId}:
 *   get:
 *     summary: Get sensor information by ID
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the sensor to get
 *     responses:
 *       200:
 *         description: Sensor information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Bad request, missing sensor ID
 *       401:
 *         description: Unauthorized, authentication required
 *       403:
 *         description: Forbidden, no permission to access this sensor
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.get('/:sensorId', SensorController.getSensorInfo);

/**
 * @swagger
 * /api/sensors/{sensorId}:
 *   put:
 *     summary: Update sensor information
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the sensor to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the sensor
 *               description:
 *                 type: string
 *                 description: New description for the sensor
 *     responses:
 *       200:
 *         description: Sensor information updated successfully
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
 *                   example: Sensor information updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Bad request, missing sensor ID or update data
 *       401:
 *         description: Unauthorized, authentication required
 *       403:
 *         description: Forbidden, no permission to update this sensor
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.put('/:sensorId', SensorController.updateSensorInfo);

/**
 * @swagger
 * /api/sensors/{sensorId}:
 *   delete:
 *     summary: Unregister (delete) a sensor
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the sensor to delete
 *     responses:
 *       200:
 *         description: Sensor unregistered successfully
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
 *                   example: Sensor unregistered successfully
 *       400:
 *         description: Bad request, missing sensor ID
 *       401:
 *         description: Unauthorized, authentication required
 *       403:
 *         description: Forbidden, no permission to delete this sensor
 *       404:
 *         description: Sensor not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:sensorId', SensorController.unregisterSensor);

export default router;