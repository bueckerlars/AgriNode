import { Router } from 'express';
import SensorDataController from '../controller/SensorDataController';
import AuthMiddleware from '../middleware/AuthMiddleware';

const router = Router();

// Apply authentication middleware to all sensor data routes
// router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/sensor-data:
 *   post:
 *     summary: Create new sensor data
 *     tags: [Sensor Data]
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
 *               - air_humidity
 *               - air_temperature
 *               - soil_moisture
 *               - soil_temperature
 *               - brightness
 *               - battery_level
 *             properties:
 *               sensor_id:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               air_humidity:
 *                 type: number
 *               air_temperature:
 *                 type: number
 *               soil_moisture:
 *                 type: number
 *               soil_temperature:
 *                 type: number
 *               brightness:
 *                 type: number
 *               battery_level:
 *                 type: number
 *     responses:
 *       201:
 *         description: Sensor data created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorData'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', SensorDataController.createSensorData);

/**
 * @swagger
 * /api/sensor-data:
 *   get:
 *     summary: Get all sensor data
 *     tags: [Sensor Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sensor data records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorData'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', SensorDataController.getAllSensorData);

/**
 * @swagger
 * /api/sensor-data/{id}:
 *   get:
 *     summary: Get sensor data by ID
 *     tags: [Sensor Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Sensor data ID
 *     responses:
 *       200:
 *         description: Sensor data record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorData'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sensor data not found
 *       500:
 *         description: Server error
 */
router.get('/:id', SensorDataController.getSensorDataById);

/**
 * @swagger
 * /api/sensor-data/sensor/{sensorId}:
 *   post:
 *     summary: Get all data for a specific sensor
 *     tags: [Sensor Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Sensor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID of the user requesting the data
 *     responses:
 *       200:
 *         description: List of sensor data records for the specified sensor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have access to the sensor
 *       500:
 *         description: Server error
 */
router.post('/sensor/:sensorId', SensorDataController.getSensorData);

/**
 * @swagger
 * /api/sensor-data/sensor/{sensorId}/timerange:
 *   post:
 *     summary: Get sensor data within a time range
 *     tags: [Sensor Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Sensor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - startTime
 *               - endTime
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID of the user requesting the data
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Start time (ISO format)
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: End time (ISO format)
 *     responses:
 *       200:
 *         description: List of sensor data records within the specified time range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorData'
 *       400:
 *         description: Bad request, invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have access to the sensor
 *       500:
 *         description: Server error
 */
router.post('/sensor/:sensorId/timerange', SensorDataController.getSensorDataByTimeRange);

/**
 * @swagger
 * /api/sensor-data/{id}:
 *   put:
 *     summary: Update sensor data
 *     tags: [Sensor Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Sensor data ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               air_humidity:
 *                 type: number
 *               air_temperature:
 *                 type: number
 *               soil_moisture:
 *                 type: number
 *               soil_temperature:
 *                 type: number
 *               brightness:
 *                 type: number
 *               battery_level:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated sensor data record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorData'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sensor data not found
 *       500:
 *         description: Server error
 */
router.put('/:id', SensorDataController.updateSensorData);

/**
 * @swagger
 * /api/sensor-data/{id}:
 *   delete:
 *     summary: Delete sensor data
 *     tags: [Sensor Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Sensor data ID
 *     responses:
 *       200:
 *         description: Sensor data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sensor data not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', SensorDataController.deleteSensorData);

/**
 * @swagger
 * /api/sensor-data/sensor/{sensorId}:
 *   delete:
 *     summary: Delete all data for a specific sensor
 *     tags: [Sensor Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Sensor ID
 *     responses:
 *       200:
 *         description: Sensor data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/sensor/:sensorId', SensorDataController.deleteAllSensorData);

/**
 * @swagger
 * components:
 *   schemas:
 *     SensorData:
 *       type: object
 *       required:
 *         - data_id
 *         - sensor_id
 *         - timestamp
 *         - value
 *         - unit
 *       properties:
 *         data_id:
 *           type: string
 *           description: Unique identifier for the data point
 *         sensor_id:
 *           type: string
 *           description: ID of the sensor that generated this data
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the data was recorded
 *         value:
 *           type: number
 *           description: Measured value
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *         battery_level:
 *           type: number
 *           format: float
 *           description: Optional battery level at time of measurement
 *           minimum: 0
 *           maximum: 100
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date when the data record was created
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;