import { Firmware, CreateFirmwareInput } from '../types/firmware';
import logger from '../config/logger';
import databaseController from '../controller/DatabaseController';
import { compareVersions } from 'compare-versions';
import crypto from 'crypto';
import fs from 'fs';

class FirmwareService {
    /**
     * Upload a new firmware version
     */
    async uploadFirmware(version: string, filePath: string): Promise<Firmware> {
        try {
            // Calculate file checksum
            const fileBuffer = fs.readFileSync(filePath);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const checksum = hashSum.digest('hex');

            const firmware = await databaseController.createFirmware({
                version,
                file_path: filePath,
                checksum,
                active: false
            });

            if (!firmware) {
                throw new Error('Failed to create firmware record');
            }

            logger.info(`New firmware version ${version} uploaded successfully`);
            return firmware;
        } catch (error) {
            logger.error(`Error in FirmwareService.uploadFirmware: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Set a firmware version as active (to be installed by sensors)
     */
    async setActiveFirmware(firmwareId: string): Promise<Firmware | null> {
        try {
            // First, deactivate all firmware versions
            await databaseController.updateAllFirmware(
                { active: false },
                { active: true }
            );

            // Then activate the specified firmware
            const [updateCount] = await databaseController.updateFirmware(
                { active: true },
                { firmware_id: firmwareId }
            );

            if (updateCount === 0) {
                throw new Error('Firmware not found');
            }

            return await databaseController.findFirmwareById(firmwareId);
        } catch (error) {
            logger.error(`Error in FirmwareService.setActiveFirmware: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Check if an update is available for a specific sensor version
     */
    async checkForUpdate(currentVersion: string): Promise<{ updateAvailable: boolean; firmware: Firmware | null }> {
        try {
            const activeFirmware = await databaseController.findOneFirmware({
                where: { active: true }
            });

            if (!activeFirmware) {
                return { updateAvailable: false, firmware: null };
            }

            // Compare versions using semver
            const updateAvailable = compareVersions(activeFirmware.version, currentVersion) > 0;

            return {
                updateAvailable,
                firmware: updateAvailable ? activeFirmware : null
            };
        } catch (error) {
            logger.error(`Error in FirmwareService.checkForUpdate: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Get all firmware versions
     */
    async getAllFirmware(): Promise<Firmware[]> {
        try {
            return await databaseController.findAllFirmware();
        } catch (error) {
            logger.error(`Error in FirmwareService.getAllFirmware: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Get firmware by ID
     */
    async getFirmwareById(firmwareId: string): Promise<Firmware | null> {
        try {
            return await databaseController.findFirmwareById(firmwareId);
        } catch (error) {
            logger.error(`Error in FirmwareService.getFirmwareById: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Delete a firmware version
     */
    async deleteFirmware(firmwareId: string): Promise<boolean> {
        try {
            const firmware = await databaseController.findFirmwareById(firmwareId);
            
            if (!firmware) {
                throw new Error('Firmware not found');
            }

            if (firmware.active) {
                throw new Error('Cannot delete active firmware');
            }

            // Delete the file
            if (fs.existsSync(firmware.file_path)) {
                fs.unlinkSync(firmware.file_path);
            }

            // Delete the database record
            const deleteCount = await databaseController.deleteFirmware({
                firmware_id: firmwareId
            });

            return deleteCount > 0;
        } catch (error) {
            logger.error(`Error in FirmwareService.deleteFirmware: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}

export default new FirmwareService();