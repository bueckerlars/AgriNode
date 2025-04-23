import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import { SensorAnalytics, AnalysisType, TimeRange, CreateAnalyticsRequest } from '../types/api';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsContextProps {
  analytics: SensorAnalytics[];
  loadingAnalytics: boolean;
  createAnalysis: (sensorId: string, type: AnalysisType, timeRange: TimeRange) => Promise<SensorAnalytics | null>;
  deleteAnalysis: (analyticsId: string) => Promise<boolean>;
  refreshAnalytics: () => Promise<void>;
  getAnalyticsForSensor: (sensorId: string) => Promise<SensorAnalytics[]>;
}

const AnalyticsContext = createContext<AnalyticsContextProps | null>(null);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const [analytics, setAnalytics] = useState<SensorAnalytics[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const { toast } = useToast();

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await analyticsApi.getUserAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Fehler',
        description: 'Analysen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const refreshAnalytics = async () => {
    await loadAnalytics();
  };

  const createAnalysis = async (sensorId: string, type: AnalysisType, timeRange: TimeRange): Promise<SensorAnalytics | null> => {
    try {
      const request: CreateAnalyticsRequest = {
        sensor_id: sensorId,
        type,
        parameters: {
          timeRange
        }
      };
      
      const newAnalytics = await analyticsApi.createAnalytics(request);
      
      if (newAnalytics) {
        setAnalytics(prev => [...prev, newAnalytics]);
        toast({
          title: 'Analyse erstellt',
          description: 'Die Analyse wurde erfolgreich erstellt und wird verarbeitet.',
        });
        return newAnalytics;
      }
      return null;
    } catch (error) {
      console.error('Failed to create analysis:', error);
      toast({
        title: 'Fehler',
        description: 'Analyse konnte nicht erstellt werden.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteAnalysis = async (analyticsId: string): Promise<boolean> => {
    try {
      const success = await analyticsApi.deleteAnalytics(analyticsId);
      
      if (success) {
        setAnalytics(prev => prev.filter(a => a.analytics_id !== analyticsId));
        toast({
          title: 'Analyse gelöscht',
          description: 'Die Analyse wurde erfolgreich gelöscht.',
        });
      }
      
      return success;
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      toast({
        title: 'Fehler',
        description: 'Analyse konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getAnalyticsForSensor = async (sensorId: string): Promise<SensorAnalytics[]> => {
    try {
      return await analyticsApi.getSensorAnalytics(sensorId);
    } catch (error) {
      console.error('Failed to load sensor analytics:', error);
      toast({
        title: 'Fehler',
        description: 'Analysen für diesen Sensor konnten nicht geladen werden.',
        variant: 'destructive',
      });
      return [];
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        analytics,
        loadingAnalytics,
        createAnalysis,
        deleteAnalysis,
        refreshAnalytics,
        getAnalyticsForSensor
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};