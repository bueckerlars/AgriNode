import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import databaseController from '../controller/DatabaseController';
import { SensorSharing, SharingStatus, Sensor, User } from '../types';

// Interface für das Join-Ergebnis von SensorSharing mit User
interface SensorSharingWithUser extends SensorSharing {
  sharedWith?: {
    user_id: string;
    username: string;
    email: string;
  };
}

class SensorSharingService {
  /**
   * Teilt einen Sensor mit einem anderen Benutzer
   */
  async shareSensor(sensorId: string, ownerId: string, sharedWithId: string): Promise<SensorSharing> {
    try {
      logger.info(`Sharing sensor ${sensorId} owned by ${ownerId} with user ${sharedWithId}`);
      
      // Überprüfen, ob der Sensor existiert und dem Eigentümer gehört
      const sensor = await databaseController.findOneSensor({
        where: { sensor_id: sensorId, user_id: ownerId }
      });
      
      if (!sensor) {
        logger.warn(`Sensor ${sensorId} not found or does not belong to user ${ownerId}`);
        throw new Error('Sensor not found or you do not have permission to share it');
      }
      
      // Überprüfen, ob der andere Benutzer existiert
      const sharedWithUser = await databaseController.findUserById(sharedWithId);
      
      if (!sharedWithUser) {
        logger.warn(`User ${sharedWithId} to share with not found`);
        throw new Error('User to share with not found');
      }
      
      // Überprüfen, ob der Sensor bereits mit diesem Benutzer geteilt wird
      const existingSharing = await databaseController.findOneSensorSharing({
        where: {
          sensor_id: sensorId,
          owner_id: ownerId,
          shared_with_id: sharedWithId
        }
      });
      
      if (existingSharing) {
        logger.warn(`Sensor ${sensorId} is already shared with user ${sharedWithId}`);
        throw new Error('Sensor is already shared with this user');
      }
      
      // Erstellen des neuen Sharing-Eintrags
      const sharingData: Partial<SensorSharing> = {
        sharing_id: uuidv4(),
        sensor_id: sensorId,
        owner_id: ownerId,
        shared_with_id: sharedWithId,
        status: 'pending'
      };
      
      const newSharing = await databaseController.createSensorSharing(sharingData);
      
      if (!newSharing) {
        throw new Error('Failed to share sensor');
      }
      
      logger.info(`Sensor ${sensorId} successfully shared with user ${sharedWithId}`);
      return newSharing;
    } catch (error) {
      logger.error(`Error in SensorSharingService.shareSensor: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Akzeptiert oder lehnt eine Sensor-Freigabe ab
   */
  async updateSharingStatus(sharingId: string, userId: string, status: SharingStatus): Promise<SensorSharing> {
    try {
      logger.info(`Updating sharing ${sharingId} status to ${status} by user ${userId}`);

      const sharing = await databaseController.findOneSensorSharing({
        where: { 
          sharing_id: sharingId,
          shared_with_id: userId,
          status: 'pending'
        }
      });

      if (!sharing) {
        logger.warn(`Sharing ${sharingId} not found or not pending for user ${userId}`);
        throw new Error('Sharing not found or already processed');
      }

      const updatedSharing = await databaseController.updateSensorSharing(
        { status },
        { where: { sharing_id: sharingId } }
      );

      if (!updatedSharing) {
        throw new Error('Failed to update sharing status');
      }

      logger.info(`Successfully updated sharing ${sharingId} status to ${status}`);
      return updatedSharing;
    } catch (error) {
      logger.error(`Error in SensorSharingService.updateSharingStatus: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Entfernt die Freigabe eines Sensors für einen anderen Benutzer
   */
  async unshareWithUser(sensorId: string, ownerId: string, sharedWithId: string): Promise<boolean> {
    try {
      logger.info(`Unsharing sensor ${sensorId} from user ${sharedWithId}`);
      
      // Überprüfen, ob der Sensor existiert und dem Eigentümer gehört
      const sensor = await databaseController.findOneSensor({
        where: { sensor_id: sensorId, user_id: ownerId }
      });
      
      if (!sensor) {
        logger.warn(`Sensor ${sensorId} not found or does not belong to user ${ownerId}`);
        throw new Error('Sensor not found or you do not have permission to unshare it');
      }
      
      // Löschen des Sharing-Eintrags
      const deleteCount = await databaseController.deleteSensorSharing({
        sensor_id: sensorId,
        owner_id: ownerId,
        shared_with_id: sharedWithId
      });
      
      if (deleteCount === 0) {
        logger.warn(`No sharing record found for sensor ${sensorId} and user ${sharedWithId}`);
        throw new Error('Sharing record not found');
      }
      
      logger.info(`Successfully unshared sensor ${sensorId} from user ${sharedWithId}`);
      return true;
    } catch (error) {
      logger.error(`Error in SensorSharingService.unshareWithUser: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Entfernt alle Freigaben für einen bestimmten Sensor
   */
  async removeAllSharings(sensorId: string, ownerId: string): Promise<boolean> {
    try {
      logger.info(`Removing all sharings for sensor ${sensorId}`);
      
      // Überprüfen, ob der Sensor existiert und dem Eigentümer gehört
      const sensor = await databaseController.findOneSensor({
        where: { sensor_id: sensorId, user_id: ownerId }
      });
      
      if (!sensor) {
        logger.warn(`Sensor ${sensorId} not found or does not belong to user ${ownerId}`);
        throw new Error('Sensor not found or you do not have permission to remove sharings');
      }
      
      // Löschen aller Sharing-Einträge für diesen Sensor
      const deleteCount = await databaseController.deleteSensorSharing({
        sensor_id: sensorId,
        owner_id: ownerId
      });
      
      logger.info(`Removed ${deleteCount} sharing records for sensor ${sensorId}`);
      return true;
    } catch (error) {
      logger.error(`Error in SensorSharingService.removeAllSharings: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Holt alle Sensoren, die mit einem bestimmten Benutzer geteilt wurden
   */
  async getSensorsSharedWithUser(userId: string): Promise<Sensor[]> {
    try {
      logger.info(`Getting all sensors shared with user ${userId}`);
      
      // Holen aller Sharing-Einträge für diesen Benutzer
      const sharings = await databaseController.findSensorSharingsBySharedWith(userId);
      
      // Filtern nach akzeptierten Freigaben
      const acceptedSharings = sharings.filter(sharing => sharing.status === 'accepted');
      
      // Extrahieren der Sensor-IDs
      const sensorIds = acceptedSharings.map(sharing => sharing.sensor_id);
      
      if (sensorIds.length === 0) {
        return [];
      }
      
      // Holen der entsprechenden Sensoren
      const sensors = await databaseController.findAllSensors({
        where: {
          sensor_id: sensorIds
        }
      });
      
      logger.info(`Found ${sensors.length} sensors shared with user ${userId}`);
      return sensors;
    } catch (error) {
      logger.error(`Error in SensorSharingService.getSensorsSharedWithUser: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Holt alle ausstehenden (pending) Sensor-Freigaben für einen Benutzer
   */
  async getPendingSensorShares(userId: string): Promise<Array<SensorSharing & { sensor: Sensor, owner: User }>> {
    try {
      logger.info(`Getting pending sensor shares for user ${userId}`);
      
      const pendingShares = await databaseController.findAllSensorSharings({
        where: {
          shared_with_id: userId,
          status: 'pending'
        },
        include: [
          {
            model: databaseController.getModel('Sensor'),
            as: 'Sensor'
          },
          {
            model: databaseController.getModel('User'),
            as: 'owner',
            attributes: ['user_id', 'username', 'email']
          }
        ]
      }) as unknown as Array<SensorSharing & { sensor: Sensor, owner: User }>;
      
      logger.info(`Found ${pendingShares.length} pending shares for user ${userId}`);
      return pendingShares;
    } catch (error) {
      logger.error(`Error in SensorSharingService.getPendingSensorShares: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Prüft, ob ein Benutzer Zugriff auf einen Sensor hat (entweder als Eigentümer oder durch akzeptierte Freigabe)
   */
  async checkSensorAccess(sensorId: string, userId: string): Promise<{ hasAccess: boolean, isOwner: boolean }> {
    try {
      logger.info(`Checking access for user ${userId} to sensor ${sensorId}`);
      
      // Prüfen, ob der Benutzer der Eigentümer ist
      const sensor = await databaseController.findOneSensor({
        where: { sensor_id: sensorId }
      });
      
      if (!sensor) {
        logger.warn(`Sensor ${sensorId} not found`);
        throw new Error('Sensor not found');
      }
      
      if (sensor.user_id === userId) {
        logger.info(`User ${userId} is the owner of sensor ${sensorId}`);
        return { hasAccess: true, isOwner: true };
      }
      
      // Wenn nicht der Eigentümer, prüfen, ob der Sensor geteilt und akzeptiert wurde
      const sharing = await databaseController.findOneSensorSharing({
        where: {
          sensor_id: sensorId,
          shared_with_id: userId,
          status: 'accepted'
        }
      });
      
      const hasAccess = !!sharing;
      logger.info(`User ${userId} ${hasAccess ? 'has' : 'does not have'} shared access to sensor ${sensorId}`);
      
      return { hasAccess, isOwner: false };
    } catch (error) {
      logger.error(`Error in SensorSharingService.checkSensorAccess: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Holt alle Benutzer, mit denen ein bestimmter Sensor geteilt wurde
   */
  async getSharedUsers(sensorId: string, ownerId: string): Promise<{ sharing_id: string, user_id: string, username: string, email: string, status: SharingStatus }[]> {
    try {
      logger.info(`Getting all users with whom sensor ${sensorId} is shared`);
      
      // Überprüfen, ob der Sensor existiert und dem Eigentümer gehört
      const sensor = await databaseController.findOneSensor({
        where: { sensor_id: sensorId, user_id: ownerId }
      });
      
      if (!sensor) {
        logger.warn(`Sensor ${sensorId} not found or does not belong to user ${ownerId}`);
        throw new Error('Sensor not found or you do not have permission to view sharings');
      }
      
      // SQL-Abfrage zum Abrufen der Benutzerinformationen mit Join
      const sharings = await databaseController.findAllSensorSharings({
        where: { sensor_id: sensorId, owner_id: ownerId },
        include: [{
          model: databaseController.getModel('User'),
          as: 'sharedWith',
          attributes: ['user_id', 'username', 'email']
        }]
      }) as SensorSharingWithUser[];
      
      // Extraktion der relevanten Benutzerinformationen
      const sharedUsers = sharings.map(sharing => {
        // Prüfen, ob sharedWith existiert (inkludierte Daten könnten fehlen)
        if (!sharing.sharedWith) {
          logger.warn(`No shared user data found for sharing ID ${sharing.sharing_id}`);
          return null;
        }
        
        return {
          sharing_id: sharing.sharing_id,
          user_id: sharing.sharedWith.user_id,
          username: sharing.sharedWith.username,
          email: sharing.sharedWith.email,
          status: sharing.status
        };
      }).filter((user): user is { sharing_id: string, user_id: string, username: string, email: string, status: SharingStatus } => 
        user !== null
      );
      
      logger.info(`Found ${sharedUsers.length} users with whom sensor ${sensorId} is shared`);
      return sharedUsers;
    } catch (error) {
      logger.error(`Error in SensorSharingService.getSharedUsers: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Entfernt eine spezifische Freigabe für einen Sensor für den aktuellen Benutzer
   */
  async removeShare(sensorId: string, userId: string): Promise<boolean> {
    try {
      logger.info(`Removing share for sensor ${sensorId} by user ${userId}`);
      
      // Finde die Freigabe
      const sharing = await databaseController.findOneSensorSharing({
        where: {
          sensor_id: sensorId,
          shared_with_id: userId,
          status: 'accepted'
        }
      });
      
      if (!sharing) {
        logger.warn(`No active sharing found for sensor ${sensorId} and user ${userId}`);
        throw new Error('Keine aktive Freigabe gefunden');
      }
      
      // Lösche die Freigabe
      const deleteCount = await databaseController.deleteSensorSharing({
        sensor_id: sensorId,
        shared_with_id: userId
      });
      
      if (deleteCount === 0) {
        throw new Error('Fehler beim Entfernen der Freigabe');
      }
      
      logger.info(`Successfully removed share for sensor ${sensorId} by user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error in SensorSharingService.removeShare: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

// Singleton-Instanz erstellen
export const sensorSharingService = new SensorSharingService();
export default sensorSharingService;