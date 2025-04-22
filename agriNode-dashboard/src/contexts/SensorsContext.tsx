import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sensor, RegisterSensorRequest, UpdateSensorRequest } from '@/types/api';
import sensorApi from '@/api/sensorApi';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { IndexedDBService } from '@/services/indexedDBService';

interface SensorsContextType {
  sensors: Sensor[];
  loading: boolean;
  error: string | null;
  fetchSensors: () => Promise<void>;
  getSensorById: (id: string) => Sensor | undefined;
  registerSensor: (data: RegisterSensorRequest) => Promise<Sensor>;
  updateSensor: (id: string, data: UpdateSensorRequest) => Promise<Sensor>;
  deleteSensor: (id: string) => Promise<void>;
}

const SensorsContext = createContext<SensorsContextType | undefined>(undefined);

export const useSensors = () => {
  const context = useContext(SensorsContext);
  if (context === undefined) {
    throw new Error('useSensors must be used within a SensorsProvider');
  }
  return context;
};

interface SensorsProviderProps {
  children: ReactNode;
}

export const SensorsProvider: React.FC<SensorsProviderProps> = ({ children }) => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
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

  const fetchSensors = async () => {
    if (!user || !isDbInitialized) return;

    try {
      setLoading(true);
      setError(null);

      // Try to get sensors from cache first
      try {
        const cachedSensors = await db.getCachedSensors();
        if (cachedSensors.length > 0) {
          setSensors(cachedSensors);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Failed to read from cache:', e);
      }

      // Fetch fresh data from API
      const data = await sensorApi.getAllSensors();
      setSensors(data);

      // Update cache
      if (isDbInitialized) {
        try {
          await db.cacheSensors(data);
        } catch (e) {
          console.warn('Failed to update cache:', e);
        }
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Sensoren:', error);
      setError('Fehler beim Laden der Sensoren');
      toast.error('Fehler beim Laden der Sensoren');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isDbInitialized) {
      fetchSensors();
    } else if (!user && isDbInitialized) {
      setSensors([]);
      db.clearCache().catch(console.error);
    }
  }, [user, isDbInitialized]);

  const getSensorById = (id: string) => {
    return sensors.find(sensor => sensor.sensor_id === id);
  };

  const registerSensor = async (data: RegisterSensorRequest) => {
    try {
      setLoading(true);
      const newSensor = await sensorApi.registerSensor(data);
      setSensors(prev => [...prev, newSensor]);
      
      // Update cache
      try {
        await db.cacheSensors([...sensors, newSensor]);
      } catch (e) {
        console.warn('Failed to update cache:', e);
      }
      
      toast.success('Sensor erfolgreich registriert');
      return newSensor;
    } catch (error) {
      console.error('Fehler beim Registrieren des Sensors:', error);
      toast.error('Fehler beim Registrieren des Sensors');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSensor = async (id: string, data: UpdateSensorRequest) => {
    try {
      setLoading(true);
      const updatedSensor = await sensorApi.updateSensor(id, data);
      const updatedSensors = sensors.map(sensor => 
        sensor.sensor_id === id ? updatedSensor : sensor
      );
      setSensors(updatedSensors);
      
      // Update cache
      try {
        await db.cacheSensors(updatedSensors);
      } catch (e) {
        console.warn('Failed to update cache:', e);
      }
      
      toast.success('Sensor erfolgreich aktualisiert');
      return updatedSensor;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Sensors:', error);
      toast.error('Fehler beim Aktualisieren des Sensors');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteSensor = async (id: string) => {
    try {
      setLoading(true);
      await sensorApi.deleteSensor(id);
      const updatedSensors = sensors.filter(sensor => sensor.sensor_id !== id);
      setSensors(updatedSensors);
      
      // Update cache
      try {
        await db.cacheSensors(updatedSensors);
      } catch (e) {
        console.warn('Failed to update cache:', e);
      }
      
      toast.success('Sensor erfolgreich gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen des Sensors:', error);
      toast.error('Fehler beim Löschen des Sensors');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    sensors,
    loading,
    error,
    fetchSensors,
    getSensorById,
    registerSensor,
    updateSensor,
    deleteSensor
  };

  return <SensorsContext.Provider value={value}>{children}</SensorsContext.Provider>;
};
