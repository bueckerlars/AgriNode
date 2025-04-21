import { Router } from 'express';
import FirmwareController from '../controller/FirmwareController';
import AuthMiddleware from '../middleware/AuthMiddleware';
import UserRoleMiddleware from '../middleware/UserRoleMiddleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for firmware file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/firmware');
    },
    filename: (req, file, cb) => {
        cb(null, `firmware-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// API-Key Authentifizierung für Sensor-Endpunkte
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/firmware:
 *   post:
 *     summary: Upload new firmware
 *     tags: [Firmware]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - version
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               version:
 *                 type: string
 *     responses:
 *       201:
 *         description: Firmware uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 */
router.post('/', UserRoleMiddleware.checkRole('admin'), upload.single('file'), FirmwareController.uploadFirmware);

/**
 * @swagger
 * /api/firmware/{firmwareId}/activate:
 *   post:
 *     summary: Set firmware as active
 *     tags: [Firmware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: firmwareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Firmware set as active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Firmware not found
 */
router.post('/:firmwareId/activate', UserRoleMiddleware.checkRole('admin'), FirmwareController.setActiveFirmware);

/**
 * @swagger
 * /api/firmware/check-update:
 *   get:
 *     summary: Check for firmware updates
 *     tags: [Firmware]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: currentVersion
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Update check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updateAvailable:
 *                   type: boolean
 *                 updateUrl:
 *                   type: string
 *       400:
 *         description: Current version not provided
 */
router.get('/check-update', FirmwareController.checkForUpdate);

/**
 * @swagger
 * /api/firmware/{firmwareId}/download:
 *   get:
 *     summary: Download firmware file
 *     tags: [Firmware]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: firmwareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Binary firmware file
 *       404:
 *         description: Firmware not found
 */
router.get('/:firmwareId/download', FirmwareController.downloadFirmware);

/**
 * @swagger
 * /api/firmware:
 *   get:
 *     summary: List all firmware versions
 *     tags: [Firmware]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of firmware versions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 */
router.get('/', UserRoleMiddleware.checkRole('admin'), FirmwareController.getAllFirmware);

/**
 * @swagger
 * /api/firmware/{firmwareId}:
 *   delete:
 *     summary: Delete a firmware version
 *     tags: [Firmware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: firmwareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Firmware deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Firmware not found
 */
router.delete('/:firmwareId', UserRoleMiddleware.checkRole('admin'), FirmwareController.deleteFirmware);

export default router;