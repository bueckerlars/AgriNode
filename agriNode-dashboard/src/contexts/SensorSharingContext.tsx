import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import sensorSharingApi, { SharedUser } from '../api/sensorSharingApi';
import { useAuth } from './AuthContext';
import { Sensor } from '../types/sensor';

interface SensorSharingContextType {
  sharedWithMe: Sensor[];
  sharedUsers: Record<string, SharedUser[]>;
  loading: boolean;
  error: string | null;
  shareSensor: (sensorId: string, userId: string) => Promise<void>;
  unshareSensor: (sensorId: string, sharedUserId: string) => Promise<void>;
  removeAllSharings: (sensorId: string) => Promise<void>;
  getSharedUsers: (sensorId: string) => Promise<SharedUser[]>;
  fetchSharedWithMe: () => Promise<void>;
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
  const [sharedWithMe, setSharedWithMe] = useState<Sensor[]>([]);
  const [sharedUsers, setSharedUsers] = useState<Record<string, SharedUser[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSharedWithMe();
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

  const value = {
    sharedWithMe,
    sharedUsers,
    loading,
    error,
    shareSensor,
    unshareSensor,
    removeAllSharings,
    getSharedUsers,
    fetchSharedWithMe
  };

  return (
    <SensorSharingContext.Provider value={value}>
      {children}
    </SensorSharingContext.Provider>
  );
}