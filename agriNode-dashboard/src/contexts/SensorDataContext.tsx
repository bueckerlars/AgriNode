import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SensorData } from '@/types/api';
import sensorDataApi from '@/api/sensorDataApi';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();

  const getSensorDataBySensorId = async (sensorId: string, signal?: AbortSignal) => {
    try {
      setError(null);
      if (!user) {
        throw new Error('Benutzer ist nicht eingeloggt');
      }

      const data = await sensorDataApi.getSensorDataBySensorId(sensorId, signal);
      console.log('Sensor data:', data);
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

      const data = await sensorDataApi.getSensorDataByTimeRange(sensorId, startTime, endTime, signal);
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
