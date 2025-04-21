import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import sensorSharingApi, { SharedUser, PendingShare, SharingStatus } from '../api/sensorSharingApi';
import { Sensor } from '@/types/sensor';
import { useAuth } from './AuthContext';
import { useSensors } from './SensorsContext'; // Add this line to import useSensors
import { toast } from 'sonner';

interface SensorSharingContextType {
  sharedWithMe: Sensor[];
  sharedUsers: Record<string, SharedUser[]>;
  pendingShares: PendingShare[];
  loading: boolean;
  error: string | null;
  shareSensor: (sensorId: string, userId: string) => Promise<void>;
  unshareSensor: (sensorId: string, sharedUserId: string) => Promise<void>;
  removeAllSharings: (sensorId: string) => Promise<void>;
  getSharedUsers: (sensorId: string) => Promise<SharedUser[]>;
  fetchSharedWithMe: () => Promise<void>;
  fetchPendingShares: () => Promise<void>;
  acceptShare: (sharingId: string) => Promise<void>;
  rejectShare: (sharingId: string) => Promise<void>;
  removeShare: (sensorId: string) => Promise<void>;
}

const SensorSharingContext = createContext<SensorSharingContextType | undefined>(undefined);

export function useSensorSharing() {
  const context = useContext(SensorSharingContext);
  if (context === undefined) {
    throw new Error('useSensorSharing must be used within a SensorSharingProvider');
  }
  return context;
}

export function SensorSharingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { fetchSensors } = useSensors(); // Add this line to get fetchSensors
  const [sharedWithMe, setSharedWithMe] = useState<Sensor[]>([]);
  const [sharedUsers, setSharedUsers] = useState<Record<string, SharedUser[]>>({});
  const [pendingShares, setPendingShares] = useState<PendingShare[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSharedWithMe();
      fetchPendingShares();
    }
  }, [user]);

  const fetchSharedWithMe = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const sensors = await sensorSharingApi.getSharedWithMe();
      setSharedWithMe(sensors);
    } catch (error: any) {
      console.error('Fehler beim Abrufen der geteilten Sensoren:', error);
      setError('Fehler beim Laden der geteilten Sensoren');
      toast.error('Fehler beim Laden der geteilten Sensoren');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingShares = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const shares = await sensorSharingApi.getPendingShares();
      setPendingShares(shares);
    } catch (error: any) {
      console.error('Fehler beim Abrufen der ausstehenden Freigaben:', error);
      setError('Fehler beim Laden der ausstehenden Freigaben');
      toast.error('Fehler beim Laden der ausstehenden Freigaben');
    } finally {
      setLoading(false);
    }
  };

  const getSharedUsers = async (sensorId: string): Promise<SharedUser[]> => {
    try {
      setLoading(true);
      setError(null);
      const users = await sensorSharingApi.getSharedUsers(sensorId);
      
      // Cache the results
      setSharedUsers(prev => ({
        ...prev,
        [sensorId]: users
      }));
      
      return users;
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
      setError('Fehler beim Abrufen der Benutzer');
      toast.error('Fehler beim Abrufen der Benutzer');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const shareSensor = async (sensorId: string, userId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await sensorSharingApi.shareSensor(sensorId, userId);
      toast.success('Sensor erfolgreich geteilt');
      
      // Update the shared users list
      await getSharedUsers(sensorId);
    } catch (error: any) {
      console.error('Fehler beim Teilen des Sensors:', error);
      setError('Fehler beim Teilen des Sensors');
      toast.error('Fehler beim Teilen des Sensors');
    } finally {
      setLoading(false);
    }
  };

  const unshareSensor = async (sensorId: string, sharedUserId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await sensorSharingApi.unshareSensor(sensorId, sharedUserId);
      toast.success('Freigabe des Sensors wurde aufgehoben');
      
      // Update the shared users list
      if (sharedUsers[sensorId]) {
        const updatedUsers = sharedUsers[sensorId].filter(u => u.user_id !== sharedUserId);
        setSharedUsers(prev => ({
          ...prev,
          [sensorId]: updatedUsers
        }));
      }
    } catch (error: any) {
      console.error('Fehler beim Aufheben der Freigabe:', error);
      setError('Fehler beim Aufheben der Freigabe');
      toast.error('Fehler beim Aufheben der Freigabe');
    } finally {
      setLoading(false);
    }
  };

  const removeAllSharings = async (sensorId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await sensorSharingApi.removeAllSharings(sensorId);
      toast.success('Alle Freigaben wurden entfernt');
      
      // Update the shared users list
      setSharedUsers(prev => ({
        ...prev,
        [sensorId]: []
      }));
    } catch (error: any) {
      console.error('Fehler beim Entfernen aller Freigaben:', error);
      setError('Fehler beim Entfernen aller Freigaben');
      toast.error('Fehler beim Entfernen aller Freigaben');
    } finally {
      setLoading(false);
    }
  };

  const acceptShare = async (sharingId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await sensorSharingApi.updateSharingStatus(sharingId, 'accepted');
      toast.success('Sensor-Freigabe wurde angenommen');
      
      // Remove from pending shares and update shared sensors
      setPendingShares(prev => prev.filter(share => share.sharing_id !== sharingId));
      await fetchSharedWithMe();
      await fetchSensors(); // Add this line to refresh sensors
    } catch (error: any) {
      console.error('Fehler beim Annehmen der Freigabe:', error);
      setError('Fehler beim Annehmen der Freigabe');
      toast.error('Fehler beim Annehmen der Freigabe');
    } finally {
      setLoading(false);
    }
  };

  const rejectShare = async (sharingId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await sensorSharingApi.updateSharingStatus(sharingId, 'rejected');
      toast.success('Sensor-Freigabe wurde abgelehnt');
      
      // Remove from pending shares
      setPendingShares(prev => prev.filter(share => share.sharing_id !== sharingId));
    } catch (error: any) {
      console.error('Fehler beim Ablehnen der Freigabe:', error);
      setError('Fehler beim Ablehnen der Freigabe');
      toast.error('Fehler beim Ablehnen der Freigabe');
    } finally {
      setLoading(false);
    }
  };

  const removeShare = async (sensorId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await sensorSharingApi.removeShare(sensorId);
      toast.success('Sensor-Freigabe wurde entfernt');
      
      // Update shared sensors list
      setSharedWithMe(prev => prev.filter(sensor => sensor.sensor_id !== sensorId));
      await fetchSensors(); // Add this line to refresh sensors
    } catch (error: any) {
      console.error('Fehler beim Entfernen der Freigabe:', error);
      setError('Fehler beim Entfernen der Freigabe');
      toast.error('Fehler beim Entfernen der Freigabe');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    sharedWithMe,
    sharedUsers,
    pendingShares,
    loading,
    error,
    shareSensor,
    unshareSensor,
    removeAllSharings,
    getSharedUsers,
    fetchSharedWithMe,
    fetchPendingShares,
    acceptShare,
    rejectShare,
    removeShare,
  };

  return (
    <SensorSharingContext.Provider value={value}>
      {children}
    </SensorSharingContext.Provider>
  );
}