import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SensorData } from '@/types/api';
import sensorDataApi from '@/api/sensorDataApi';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { IndexedDBService } from '@/services/indexedDBService';

interface SensorDataContextType {
  loading: boolean;
  error: string | null;
  getSensorDataBySensorId: (sensorId: string, signal?: AbortSignal) => Promise<SensorData[]>;
  getSensorDataByTimeRange: (sensorId: string, startTime: string, endTime: string, signal?: AbortSignal) => Promise<SensorData[]>;
  deleteSensorData: (dataId: string) => Promise<void>;
  deleteAllSensorDataBySensorId: (sensorId: string) => Promise<void>;
}

const SensorDataContext = createContext<SensorDataContextType | undefined>(undefined);

export const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (context === undefined) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
};

interface SensorDataProviderProps {
  children: ReactNode;
}

export const SensorDataProvider: React.FC<SensorDataProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const { user } = useAuth();
  const [db] = useState(() => new IndexedDBService());

  useEffect(() => {
    db.init()
      .then(() => setIsDbInitialized(true))
      .catch(error => {
        console.error('Failed to initialize IndexedDB:', error);
        setError('Failed to initialize local storage');
      });
  }, []);

  const getSensorDataBySensorId = async (sensorId: string, signal?: AbortSignal) => {
    try {
      setError(null);
      if (!user) {
        throw new Error('Benutzer ist nicht eingeloggt');
      }

      if (!isDbInitialized) {
        const data = await sensorDataApi.getSensorDataBySensorId(sensorId, signal);
        return data;
      }

      // Try to get data from cache first
      try {
        const cachedData = await db.getCachedSensorData(sensorId);
        if (cachedData.length > 0) {
          return cachedData;
        }
      } catch (e) {
        console.warn('Failed to read from cache:', e);
      }

      // Fetch fresh data from API
      const data = await sensorDataApi.getSensorDataBySensorId(sensorId, signal);

      // Update cache
      try {
        await db.cacheSensorData(sensorId, data);
      } catch (e) {
        console.warn('Failed to update cache:', e);
      }

      return data;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Fehler beim Abrufen der Sensordaten:', error);
        setError('Fehler beim Laden der Sensordaten');
        toast.error('Fehler beim Laden der Sensordaten');
      }
      return [];
    }
  };

  const getSensorDataByTimeRange = async (sensorId: string, startTime: string, endTime: string, signal?: AbortSignal) => {
    try {
      setError(null);
      if (!user) {
        throw new Error('Benutzer ist nicht eingeloggt');
      }

      if (!isDbInitialized) {
        const data = await sensorDataApi.getSensorDataByTimeRange(sensorId, startTime, endTime, signal);
        return data;
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      // Try to get data from cache first
      try {
        const cachedData = await db.getCachedSensorData(sensorId, start, end);
        if (cachedData.length > 0) {
          return cachedData;
        }
      } catch (e) {
        console.warn('Failed to read from cache:', e);
      }

      // Fetch fresh data from API
      const data = await sensorDataApi.getSensorDataByTimeRange(sensorId, startTime, endTime, signal);

      // Update cache
      try {
        await db.cacheSensorData(sensorId, data);
      } catch (e) {
        console.warn('Failed to update cache:', e);
      }

      return data;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Fehler beim Abrufen der Sensordaten im Zeitraum:', error);
        setError('Fehler beim Laden der Sensordaten im Zeitraum');
        toast.error('Fehler beim Laden der Sensordaten im angegebenen Zeitraum');
      }
      return [];
    }
  };

  const deleteSensorData = async (dataId: string) => {
    try {
      setLoading(true);
      await sensorDataApi.deleteSensorData(dataId);
      toast.success('Sensordaten erfolgreich gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen der Sensordaten:', error);
      toast.error('Fehler beim Löschen der Sensordaten');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAllSensorDataBySensorId = async (sensorId: string) => {
    try {
      setLoading(true);
      const result = await sensorDataApi.deleteAllSensorDataBySensorId(sensorId);
      toast.success(`${result.count} Sensordaten erfolgreich gelöscht`);
    } catch (error) {
      console.error('Fehler beim Löschen aller Sensordaten:', error);
      toast.error('Fehler beim Löschen aller Sensordaten');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    getSensorDataBySensorId,
    getSensorDataByTimeRange,
    deleteSensorData,
    deleteAllSensorDataBySensorId
  };

  return <SensorDataContext.Provider value={value}>{children}</SensorDataContext.Provider>;
};
