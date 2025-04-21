import { Request, Response } from 'express';
import firmwareService from '../services/FirmwareService';
import logger from '../config/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = 'uploads/firmware';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for firmware file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `firmware-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

class FirmwareController {
    /**
     * Upload a new firmware version
     */
    async uploadFirmware(req: Request, res: Response): Promise<void> {
        try {
            logger.info(`Firmware upload requested by user ${req.user?.id}`);
            if (!req.user || req.user.role !== 'admin') {
                logger.warn(`Unauthorized firmware upload attempt by user ${req.user?.id}`);
                res.status(403).json({
                    success: false,
                    message: 'Only admins can upload firmware'
                });
                return;
            }

            if (!req.file) {
                logger.warn('Firmware upload attempted without file');
                res.status(400).json({
                    success: false,
                    message: 'No firmware file provided'
                });
                return;
            }

            const { version } = req.body;
            if (!version) {
                logger.warn('Firmware upload attempted without version');
                res.status(400).json({
                    success: false,
                    message: 'Version is required'
                });
                return;
            }

            logger.info(`Processing firmware upload: version=${version}, file=${req.file.path}`);
            const firmware = await firmwareService.uploadFirmware(version, req.file.path);

            logger.info(`Firmware uploaded successfully: id=${firmware.firmware_id}, version=${version}`);
            res.status(201).json({
                success: true,
                message: 'Firmware uploaded successfully',
                data: firmware
            });
        } catch (error: any) {
            logger.error(`Error in FirmwareController.uploadFirmware: ${error.message}`, { error });
            res.status(500).json({
                success: false,
                message: 'Failed to upload firmware',
                error: error.message
            });
        }
    }

    /**
     * Set a firmware version as active
     */
    async setActiveFirmware(req: Request, res: Response): Promise<void> {
        try {
            logger.info(`Set active firmware requested by user ${req.user?.id}`);
            if (!req.user || req.user.role !== 'admin') {
                logger.warn(`Unauthorized set active firmware attempt by user ${req.user?.id}`);
                res.status(403).json({
                    success: false,
                    message: 'Only admins can set active firmware'
                });
                return;
            }

            const { firmwareId } = req.params;
            logger.info(`Setting firmware ${firmwareId} as active`);
            const firmware = await firmwareService.setActiveFirmware(firmwareId);

            logger.info(`Firmware ${firmwareId} set as active successfully`);
            res.status(200).json({
                success: true,
                message: 'Firmware set as active',
                data: firmware
            });
        } catch (error: any) {
            logger.error(`Error in FirmwareController.setActiveFirmware: ${error.message}`, { error });
            res.status(500).json({
                success: false,
                message: 'Failed to set active firmware',
                error: error.message
            });
        }
    }

    /**
     * Check if an update is available
     */
    async checkForUpdate(req: Request, res: Response): Promise<void> {
        try {
            const { currentVersion } = req.query;
            logger.info(`Update check requested for version ${currentVersion}`);

            if (!currentVersion || typeof currentVersion !== 'string') {
                logger.warn('Update check attempted without valid version');
                res.status(400).json({
                    success: false,
                    message: 'Current version is required'
                });
                return;
            }

            const updateInfo = await firmwareService.checkForUpdate(currentVersion);
            logger.info(`Update check result for version ${currentVersion}: updateAvailable=${updateInfo.updateAvailable}`);

            res.status(200).json({
                success: true,
                data: {
                    updateAvailable: updateInfo.updateAvailable,
                    updateUrl: updateInfo.firmware ? `/firmware/${updateInfo.firmware.firmware_id}/download` : null
                }
            });
        } catch (error: any) {
            logger.error(`Error in FirmwareController.checkForUpdate: ${error.message}`, { error });
            res.status(500).json({
                success: false,
                message: 'Failed to check for updates',
                error: error.message
            });
        }
    }

    /**
     * Download firmware file
     */
    async downloadFirmware(req: Request, res: Response): Promise<void> {
        try {
            const { firmwareId } = req.params;
            logger.info(`Firmware download requested: ${firmwareId}`);
            
            const firmware = await firmwareService.getFirmwareById(firmwareId);

            if (!firmware) {
                logger.warn(`Download attempted for non-existent firmware: ${firmwareId}`);
                res.status(404).json({
                    success: false,
                    message: 'Firmware not found'
                });
                return;
            }

            logger.info(`Serving firmware download: id=${firmwareId}, version=${firmware.version}`);
            res.download(firmware.file_path);
        } catch (error: any) {
            logger.error(`Error in FirmwareController.downloadFirmware: ${error.message}`, { error });
            res.status(500).json({
                success: false,
                message: 'Failed to download firmware',
                error: error.message
            });
        }
    }

    /**
     * List all firmware versions
     */
    async getAllFirmware(req: Request, res: Response): Promise<void> {
        try {
            logger.info(`Firmware list requested by user ${req.user?.id}`);
            if (!req.user || req.user.role !== 'admin') {
                logger.warn(`Unauthorized firmware list attempt by user ${req.user?.id}`);
                res.status(403).json({
                    success: false,
                    message: 'Only admins can view firmware list'
                });
                return;
            }

            const firmwareList = await firmwareService.getAllFirmware();
            logger.info(`Retrieved ${firmwareList.length} firmware versions`);

            res.status(200).json({
                success: true,
                data: firmwareList
            });
        } catch (error: any) {
            logger.error(`Error in FirmwareController.getAllFirmware: ${error.message}`, { error });
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve firmware list',
                error: error.message
            });
        }
    }

    /**
     * Delete a firmware version
     */
    async deleteFirmware(req: Request, res: Response): Promise<void> {
        try {
            logger.info(`Firmware deletion requested by user ${req.user?.id}`);
            if (!req.user || req.user.role !== 'admin') {
                logger.warn(`Unauthorized firmware deletion attempt by user ${req.user?.id}`);
                res.status(403).json({
                    success: false,
                    message: 'Only admins can delete firmware'
                });
                return;
            }

            const { firmwareId } = req.params;
            logger.info(`Deleting firmware: ${firmwareId}`);
            await firmwareService.deleteFirmware(firmwareId);

            logger.info(`Firmware ${firmwareId} deleted successfully`);
            res.status(200).json({
                success: true,
                message: 'Firmware deleted successfully'
            });
        } catch (error: any) {
            logger.error(`Error in FirmwareController.deleteFirmware: ${error.message}`, { error });
            res.status(500).json({
                success: false,
                message: 'Failed to delete firmware',
                error: error.message
            });
        }
    }
}

export default new FirmwareController();