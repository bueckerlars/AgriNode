import { Request, Response } from 'express';
import logger from '../config/logger';
import sensorSharingService from '../services/SensorSharingService';
import { SharingStatus } from '../types/SensorSharing';

class SensorSharingController {
    /**
     * Teilt einen Sensor mit einem anderen Benutzer
     */
    async shareSensor(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const ownerId = req.user.id;
            const { sensorId } = req.params;
            const { userId } = req.body;
            
            if (!sensorId || !userId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor-ID und Benutzer-ID sind erforderlich' 
                });
                return;
            }
            
            const sensorSharing = await sensorSharingService.shareSensor(sensorId, ownerId, userId);
            
            res.status(201).json({
                success: true,
                message: 'Sensor wurde erfolgreich geteilt',
                data: sensorSharing
            });
        } catch (error: any) {
            logger.error(`Fehler in SensorSharingController.shareSensor: ${error.message}`);
            
            if (error.message.includes('not found') || error.message.includes('permission')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            if (error.message.includes('already shared')) {
                res.status(409).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Fehler beim Teilen des Sensors', 
                error: error.message 
            });
        }
    }

    /**
     * Aktualisiert den Status einer Sensor-Freigabe (Annehmen oder Ablehnen)
     */
    async updateSharingStatus(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }

            const userId = req.user.id;
            const { sharingId } = req.params;
            const { status } = req.body;

            if (!sharingId || !status || !['accepted', 'rejected'].includes(status)) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sharing-ID und gültiger Status (accepted/rejected) sind erforderlich' 
                });
                return;
            }

            const sharing = await sensorSharingService.updateSharingStatus(sharingId, userId, status as SharingStatus);

            res.status(200).json({
                success: true,
                message: `Sensor-Freigabe wurde erfolgreich ${status === 'accepted' ? 'angenommen' : 'abgelehnt'}`,
                data: sharing
            });
        } catch (error: any) {
            logger.error(`Fehler in SensorSharingController.updateSharingStatus: ${error.message}`);

            if (error.message.includes('not found') || error.message.includes('already processed')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }

            res.status(500).json({ 
                success: false, 
                message: 'Fehler beim Aktualisieren der Freigabe', 
                error: error.message 
            });
        }
    }

    /**
     * Holt alle ausstehenden Sensor-Freigaben für den aktuellen Benutzer
     */
    async getPendingShares(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }

            const userId = req.user.id;
            const pendingShares = await sensorSharingService.getPendingSensorShares(userId);

            res.status(200).json({
                success: true,
                data: pendingShares
            });
        } catch (error: any) {
            logger.error(`Fehler in SensorSharingController.getPendingShares: ${error.message}`);

            res.status(500).json({ 
                success: false, 
                message: 'Fehler beim Abrufen der ausstehenden Freigaben', 
                error: error.message 
            });
        }
    }

    /**
     * Hebt die Freigabe eines Sensors für einen Benutzer auf
     */
    async unshareSensor(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const ownerId = req.user.id;
            const { sensorId, sharedUserId } = req.params;
            
            if (!sensorId || !sharedUserId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor-ID und Benutzer-ID sind erforderlich' 
                });
                return;
            }
            
            await sensorSharingService.unshareWithUser(sensorId, ownerId, sharedUserId);
            
            res.status(200).json({
                success: true,
                message: 'Freigabe des Sensors wurde erfolgreich aufgehoben'
            });
        } catch (error: any) {
            logger.error(`Fehler in SensorSharingController.unshareSensor: ${error.message}`);
            
            if (error.message.includes('not found')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            if (error.message.includes('permission')) {
                res.status(403).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Fehler beim Aufheben der Freigabe', 
                error: error.message 
            });
        }
    }

    /**
     * Entfernt alle Freigaben für einen Sensor
     */
    async removeAllSharings(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const ownerId = req.user.id;
            const { sensorId } = req.params;
            
            if (!sensorId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor-ID ist erforderlich' 
                });
                return;
            }
            
            await sensorSharingService.removeAllSharings(sensorId, ownerId);
            
            res.status(200).json({
                success: true,
                message: 'Alle Freigaben für den Sensor wurden erfolgreich entfernt'
            });
        } catch (error: any) {
            logger.error(`Fehler in SensorSharingController.removeAllSharings: ${error.message}`);
            
            if (error.message.includes('not found')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            if (error.message.includes('permission')) {
                res.status(403).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Fehler beim Entfernen aller Freigaben', 
                error: error.message 
            });
        }
    }

    /**
     * Entfernt die Freigabe eines Sensors für den aktuellen Benutzer
     */
    async removeShare(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const userId = req.user.id;
            const { sensorId } = req.params;
            
            if (!sensorId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor-ID ist erforderlich' 
                });
                return;
            }
            
            await sensorSharingService.removeShare(sensorId, userId);
            
            res.status(200).json({
                success: true,
                message: 'Sensor-Freigabe wurde erfolgreich entfernt'
            });
        } catch (error: any) {
            logger.error(`Fehler in SensorSharingController.removeShare: ${error.message}`);
            
            if (error.message.includes('nicht gefunden') || error.message.includes('keine aktive')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Fehler beim Entfernen der Freigabe', 
                error: error.message 
            });
        }
    }

    /**
     * Holt alle Sensoren, die mit dem authentifizierten Benutzer geteilt wurden
     */
    async getSharedSensors(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const userId = req.user.id;
            
            const sensors = await sensorSharingService.getSensorsSharedWithUser(userId);
            
            res.status(200).json({
                success: true,
                data: sensors
            });
        } catch (error: any) {
            logger.error(`Fehler in SensorSharingController.getSharedSensors: ${error.message}`);
            
            res.status(500).json({ 
                success: false, 
                message: 'Fehler beim Abrufen der geteilten Sensoren', 
                error: error.message 
            });
        }
    }

    /**
     * Liefert alle Benutzer, mit denen ein Sensor geteilt wurde
     */
    async getSharedUsers(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
                return;
            }
            
            const ownerId = req.user.id;
            const { sensorId } = req.params;
            
            if (!sensorId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Sensor-ID ist erforderlich' 
                });
                return;
            }
            
            const users = await sensorSharingService.getSharedUsers(sensorId, ownerId);
            
            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error: any) {
            logger.error(`Fehler in SensorSharingController.getSharedUsers: ${error.message}`);
            
            if (error.message.includes('not found')) {
                res.status(404).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            if (error.message.includes('permission')) {
                res.status(403).json({ 
                    success: false, 
                    message: error.message 
                });
                return;
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Fehler beim Abrufen der geteilten Benutzer', 
                error: error.message 
            });
        }
    }
}

// Singleton-Instanz erstellen
export const sensorSharingController = new SensorSharingController();
export default sensorSharingController;