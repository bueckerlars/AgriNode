import { createContext, useContext, ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import { SensorAnalytics, AnalysisType, TimeRange, CreateAnalyticsRequest, AnalysisStatus } from '../types/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { isEqual } from 'lodash';

interface AnalyticsContextProps {
  analytics: SensorAnalytics[];
  loadingAnalytics: boolean;
  createAnalysis: (sensorId: string, type: AnalysisType, timeRange: TimeRange, model?: string) => Promise<SensorAnalytics | null>;
  deleteAnalysis: (analyticsId: string) => Promise<boolean>;
  refreshAnalytics: () => Promise<void>;
  getAnalyticsForSensor: (sensorId: string) => Promise<SensorAnalytics[]>;
}

// Change to undefined instead of null as the default value
const AnalyticsContext = createContext<AnalyticsContextProps | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const [analytics, setAnalytics] = useState<SensorAnalytics[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [previousAnalyticsState, setPreviousAnalyticsState] = useState<Record<string, AnalysisStatus>>({});
  
  const REGULAR_INTERVAL = 60000; // 60 Sekunden für reguläre Abfragen
  const ACTIVE_INTERVAL = 15000;  // 15 Sekunden für aktive Analysen
  
  const intervalIdRef = useRef<number | null>(null);
  const { user, authToken } = useAuth();

  const hasActiveAnalysis = (analyticsList: SensorAnalytics[]) => {
    return analyticsList.some(
      a => a.status === AnalysisStatus.PENDING || a.status === AnalysisStatus.PROCESSING
    );
  };
  
  const checkForStatusChanges = (currentAnalytics: SensorAnalytics[]) => {
    const currentState: Record<string, AnalysisStatus> = {};
    
    currentAnalytics.forEach(analysis => {
      currentState[analysis.analytics_id] = analysis.status;
      
      if (previousAnalyticsState[analysis.analytics_id] && 
          previousAnalyticsState[analysis.analytics_id] !== analysis.status) {
        
        switch (analysis.status) {
          case AnalysisStatus.COMPLETED:
            toast.success(`Analyse "${getAnalysisTypeLabel(analysis.type)}" abgeschlossen`);
            break;
          case AnalysisStatus.FAILED:
            toast.error(`Analyse "${getAnalysisTypeLabel(analysis.type)}" fehlgeschlagen`);
            break;
          case AnalysisStatus.PROCESSING:
            toast(`Analyse "${getAnalysisTypeLabel(analysis.type)}" wird verarbeitet`);
            break;
        }
      }
    });
    
    setPreviousAnalyticsState(currentState);
  };

  const getAnalysisTypeLabel = (type: AnalysisType) => {
    switch (type) {
      case AnalysisType.TREND:
        return "Trend-Analyse";
      case AnalysisType.ANOMALY:
        return "Anomalie-Erkennung";
      case AnalysisType.FORECAST:
        return "Vorhersage";
      default:
        return type;
    }
  };

  const loadAnalytics = async () => {
    if (!user || !authToken) return;
    
    try {
      setLoadingAnalytics(true);
      const data = await analyticsApi.getUserAnalytics();
      
      checkForStatusChanges(data);
      
      setAnalytics(prevAnalytics => {
        if (!isEqual(prevAnalytics, data)) {
          return data;
        }
        return prevAnalytics;
      });
      
      setupPollingInterval(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      if (user && authToken) {
        toast.error('Analysen konnten nicht geladen werden.');
      }
    } finally {
      setLoadingAnalytics(false);
    }
  };
  
  const setupPollingInterval = (currentAnalytics: SensorAnalytics[]) => {
    const interval = hasActiveAnalysis(currentAnalytics) ? ACTIVE_INTERVAL : REGULAR_INTERVAL;
    
    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current);
    }
    
    intervalIdRef.current = window.setInterval(loadAnalytics, interval);
  };

  const refreshAnalytics = useCallback(async () => {
    await loadAnalytics();
  }, [user, authToken]);

  const createAnalysis = async (sensorId: string, type: AnalysisType, timeRange: TimeRange, model?: string): Promise<SensorAnalytics | null> => {
    try {
      const request: CreateAnalyticsRequest = {
        sensor_id: sensorId,
        type,
        parameters: {
          timeRange,
          model
        }
      };
      
      const newAnalytics = await analyticsApi.createAnalytics(request);
      
      if (newAnalytics) {
        setAnalytics(prev => {
          const updatedAnalytics = [...prev, newAnalytics];
          setupPollingInterval(updatedAnalytics);
          return updatedAnalytics;
        });
        
        toast.success('Die Analyse wurde erfolgreich erstellt und wird verarbeitet.');
        return newAnalytics;
      }
      return null;
    } catch (error) {
      console.error('Failed to create analysis:', error);
      toast.error('Analyse konnte nicht erstellt werden.');
      return null;
    }
  };

  const deleteAnalysis = async (analyticsId: string): Promise<boolean> => {
    try {
      const success = await analyticsApi.deleteAnalytics(analyticsId);
      
      if (success) {
        setAnalytics(prev => {
          const updatedAnalytics = prev.filter(a => a.analytics_id !== analyticsId);
          setupPollingInterval(updatedAnalytics);
          return updatedAnalytics;
        });
        
        toast.success('Die Analyse wurde erfolgreich gelöscht.');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      toast.error('Analyse konnte nicht gelöscht werden.');
      return false;
    }
  };

  const getAnalyticsForSensor = async (sensorId: string): Promise<SensorAnalytics[]> => {
    try {
      return await analyticsApi.getSensorAnalytics(sensorId);
    } catch (error) {
      console.error('Failed to load sensor analytics:', error);
      toast.error('Analysen für diesen Sensor konnten nicht geladen werden.');
      return [];
    }
  };

  useEffect(() => {
    if (user && authToken) {
      loadAnalytics();
    }
    
    return () => {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [user, authToken]);

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