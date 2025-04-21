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
            logger.info(`Starting firmware upload process for version ${version}`);
            logger.info(`Calculating checksum for file: ${filePath}`);
            
            // Calculate file checksum
            const fileBuffer = fs.readFileSync(filePath);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const checksum = hashSum.digest('hex');
            
            logger.info(`File checksum calculated: ${checksum}`);

            const firmware = await databaseController.createFirmware({
                version,
                file_path: filePath,
                checksum,
                active: false
            });

            if (!firmware) {
                logger.error('Failed to create firmware database record');
                throw new Error('Failed to create firmware record');
            }

            logger.info(`New firmware record created: id=${firmware.firmware_id}, version=${version}, checksum=${checksum}`);
            return firmware;
        } catch (error) {
            logger.error(`Error in FirmwareService.uploadFirmware: ${error instanceof Error ? error.message : String(error)}`, { error });
            throw error;
        }
    }

    /**
     * Set a firmware version as active (to be installed by sensors)
     */
    async setActiveFirmware(firmwareId: string): Promise<Firmware | null> {
        try {
            logger.info(`Starting process to set firmware ${firmwareId} as active`);
            
            // First, deactivate all firmware versions
            const deactivateResult = await databaseController.updateAllFirmware(
                { active: false },
                { active: true }
            );
            logger.info(`Deactivated ${deactivateResult[0]} previously active firmware versions`);

            // Then activate the specified firmware
            const [updateCount] = await databaseController.updateFirmware(
                { active: true },
                { firmware_id: firmwareId }
            );

            if (updateCount === 0) {
                logger.error(`Failed to set firmware ${firmwareId} as active: Firmware not found`);
                throw new Error('Firmware not found');
            }

            const firmware = await databaseController.findFirmwareById(firmwareId);
            logger.info(`Successfully set firmware ${firmwareId} as active, version=${firmware?.version}`);
            
            return firmware;
        } catch (error) {
            logger.error(`Error in FirmwareService.setActiveFirmware: ${error instanceof Error ? error.message : String(error)}`, { error });
            throw error;
        }
    }

    /**
     * Check if an update is available for a specific sensor version
     */
    async checkForUpdate(currentVersion: string): Promise<{ updateAvailable: boolean; firmware: Firmware | null }> {
        try {
            logger.info(`Checking for updates. Current version: ${currentVersion}`);
            
            const activeFirmware = await databaseController.findOneFirmware({
                where: { active: true }
            });

            if (!activeFirmware) {
                logger.info('No active firmware version found');
                return { updateAvailable: false, firmware: null };
            }

            logger.info(`Active firmware found: version=${activeFirmware.version}`);

            // Compare versions using semver
            const updateAvailable = compareVersions(activeFirmware.version, currentVersion) > 0;
            logger.info(`Update check result: currentVersion=${currentVersion}, latestVersion=${activeFirmware.version}, updateAvailable=${updateAvailable}`);

            return {
                updateAvailable,
                firmware: updateAvailable ? activeFirmware : null
            };
        } catch (error) {
            logger.error(`Error in FirmwareService.checkForUpdate: ${error instanceof Error ? error.message : String(error)}`, { error });
            throw error;
        }
    }

    /**
     * Get all firmware versions
     */
    async getAllFirmware(): Promise<Firmware[]> {
        try {
            logger.info('Retrieving all firmware versions');
            const firmwareList = await databaseController.findAllFirmware();
            logger.info(`Found ${firmwareList.length} firmware versions`);
            return firmwareList;
        } catch (error) {
            logger.error(`Error in FirmwareService.getAllFirmware: ${error instanceof Error ? error.message : String(error)}`, { error });
            throw error;
        }
    }

    /**
     * Get firmware by ID
     */
    async getFirmwareById(firmwareId: string): Promise<Firmware | null> {
        try {
            logger.info(`Retrieving firmware with id: ${firmwareId}`);
            const firmware = await databaseController.findFirmwareById(firmwareId);
            
            if (firmware) {
                logger.info(`Found firmware: id=${firmwareId}, version=${firmware.version}`);
            } else {
                logger.info(`No firmware found with id: ${firmwareId}`);
            }
            
            return firmware;
        } catch (error) {
            logger.error(`Error in FirmwareService.getFirmwareById: ${error instanceof Error ? error.message : String(error)}`, { error });
            throw error;
        }
    }

    /**
     * Delete a firmware version
     */
    async deleteFirmware(firmwareId: string): Promise<boolean> {
        try {
            logger.info(`Starting deletion process for firmware: ${firmwareId}`);
            
            const firmware = await databaseController.findFirmwareById(firmwareId);
            
            if (!firmware) {
                logger.warn(`Attempted to delete non-existent firmware: ${firmwareId}`);
                throw new Error('Firmware not found');
            }

            if (firmware.active) {
                logger.warn(`Attempted to delete active firmware: ${firmwareId}`);
                throw new Error('Cannot delete active firmware');
            }

            logger.info(`Deleting firmware file: ${firmware.file_path}`);
            // Delete the file
            if (fs.existsSync(firmware.file_path)) {
                fs.unlinkSync(firmware.file_path);
                logger.info('Firmware file deleted successfully');
            } else {
                logger.warn(`Firmware file not found at path: ${firmware.file_path}`);
            }

            // Delete the database record
            logger.info(`Deleting firmware database record: ${firmwareId}`);
            const deleteCount = await databaseController.deleteFirmware({
                firmware_id: firmwareId
            });

            if (deleteCount > 0) {
                logger.info(`Firmware ${firmwareId} successfully deleted`);
            } else {
                logger.warn(`No database record deleted for firmware ${firmwareId}`);
            }

            return deleteCount > 0;
        } catch (error) {
            logger.error(`Error in FirmwareService.deleteFirmware: ${error instanceof Error ? error.message : String(error)}`, { error });
            throw error;
        }
    }
}

export default new FirmwareService();