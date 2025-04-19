import { Router } from 'express';
import SensorSharingController from '../controller/SensorSharingController';
import AuthMiddleware from '../middleware/AuthMiddleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SensorSharing:
 *       type: object
 *       required:
 *         - sharing_id
 *         - sensor_id
 *         - owner_id
 *         - shared_with_id
 *         - created_at
 *         - updated_at
 *       properties:
 *         sharing_id:
 *           type: string
 *           description: Eindeutige ID des Sharing-Eintrags
 *         sensor_id:
 *           type: string
 *           description: ID des geteilten Sensors
 *         owner_id:
 *           type: string
 *           description: ID des Besitzers des Sensors
 *         shared_with_id:
 *           type: string
 *           description: ID des Benutzers, mit dem der Sensor geteilt wird
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Datum, an dem der Sensor geteilt wurde
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Datum der letzten Aktualisierung
 */

/**
 * @swagger
 * tags:
 *   name: SensorSharing
 *   description: Funktionen zum Teilen von Sensoren
 */

// Alle Sensor-Sharing-Routen benötigen Authentifizierung
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/sharing/shared-with-me:
 *   get:
 *     summary: Alle akzeptierten Sensoren abrufen, die mit dem authentifizierten Benutzer geteilt wurden
 *     tags: [SensorSharing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der geteilten Sensoren
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
 *         description: Nicht autorisiert
 *       500:
 *         description: Serverfehler
 */
router.get('/shared-with-me', SensorSharingController.getSharedSensors);

/**
 * @swagger
 * /api/sharing/{sensorId}:
 *   post:
 *     summary: Einen Sensor mit einem anderen Benutzer teilen
 *     tags: [SensorSharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des zu teilenden Sensors
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID des Benutzers, mit dem der Sensor geteilt werden soll
 *     responses:
 *       201:
 *         description: Sensor wurde erfolgreich geteilt
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
 *                   example: Sensor wurde erfolgreich geteilt
 *                 data:
 *                   $ref: '#/components/schemas/SensorSharing'
 *       400:
 *         description: Ungültige Anfrage
 *       401:
 *         description: Nicht autorisiert
 *       404:
 *         description: Sensor oder Benutzer nicht gefunden
 *       409:
 *         description: Sensor ist bereits mit diesem Benutzer geteilt
 *       500:
 *         description: Serverfehler
 */
router.post('/:sensorId', SensorSharingController.shareSensor);

/**
 * @swagger
 * /api/sharing/{sensorId}/users:
 *   get:
 *     summary: Alle Benutzer abrufen, mit denen ein Sensor geteilt wurde
 *     tags: [SensorSharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des Sensors
 *     responses:
 *       200:
 *         description: Liste der Benutzer, mit denen der Sensor geteilt wurde
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
 *                     type: object
 *                     properties:
 *                       sharing_id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: Nicht autorisiert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Sensor nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.get('/:sensorId/users', SensorSharingController.getSharedUsers);

/**
 * @swagger
 * /api/sharing/{sensorId}/{sharedUserId}:
 *   delete:
 *     summary: Freigabe eines Sensors für einen bestimmten Benutzer aufheben
 *     tags: [SensorSharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des Sensors
 *       - in: path
 *         name: sharedUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des Benutzers, für den die Freigabe aufgehoben werden soll
 *     responses:
 *       200:
 *         description: Freigabe erfolgreich aufgehoben
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
 *                   example: Freigabe des Sensors wurde erfolgreich aufgehoben
 *       401:
 *         description: Nicht autorisiert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Sensor oder Freigabe nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.delete('/:sensorId/:sharedUserId', SensorSharingController.unshareSensor);

/**
 * @swagger
 * /api/sharing/{sensorId}:
 *   delete:
 *     summary: Alle Freigaben für einen Sensor entfernen
 *     tags: [SensorSharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID des Sensors
 *     responses:
 *       200:
 *         description: Alle Freigaben erfolgreich entfernt
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
 *                   example: Alle Freigaben für den Sensor wurden erfolgreich entfernt
 *       401:
 *         description: Nicht autorisiert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Sensor nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.delete('/:sensorId', SensorSharingController.removeAllSharings);

/**
 * @swagger
 * /api/sharing/pending:
 *   get:
 *     summary: Ausstehende Sensor-Freigaben abrufen
 *     tags: [SensorSharing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der ausstehenden Freigaben
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
 *                     $ref: '#/components/schemas/SensorSharing'
 *       401:
 *         description: Nicht autorisiert
 *       500:
 *         description: Serverfehler
 */
router.get('/pending', SensorSharingController.getPendingShares);

/**
 * @swagger
 * /api/sharing/{sharingId}/status:
 *   put:
 *     summary: Status einer Sensor-Freigabe aktualisieren
 *     tags: [SensorSharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sharingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der Sensor-Freigabe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: Neuer Status der Freigabe
 *     responses:
 *       200:
 *         description: Status erfolgreich aktualisiert
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
 *                   example: Status der Freigabe wurde erfolgreich aktualisiert
 *       401:
 *         description: Nicht autorisiert
 *       404:
 *         description: Freigabe nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.put('/:sharingId/status', SensorSharingController.updateSharingStatus);

export default router;