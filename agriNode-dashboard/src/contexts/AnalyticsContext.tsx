import { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import { SensorAnalytics, AnalysisType, TimeRange, CreateAnalyticsRequest, AnalysisStatus } from '../types/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

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
  const [previousAnalyticsState, setPreviousAnalyticsState] = useState<Record<string, AnalysisStatus>>({});
  
  // Intervall-Zeiten in Millisekunden
  const REGULAR_INTERVAL = 60000; // 60 Sekunden für reguläre Abfragen
  const ACTIVE_INTERVAL = 15000;  // 15 Sekunden für aktive Analysen
  
  const intervalIdRef = useRef<number | null>(null);
  const { user, authToken } = useAuth();

  // Hilfsfunktion zum Prüfen, ob eine aktive Analyse existiert
  const hasActiveAnalysis = (analyticsList: SensorAnalytics[]) => {
    return analyticsList.some(
      a => a.status === AnalysisStatus.PENDING || a.status === AnalysisStatus.PROCESSING
    );
  };
  
  // Prüft auf Statusänderungen und zeigt Toast-Benachrichtigungen an
  const checkForStatusChanges = (currentAnalytics: SensorAnalytics[]) => {
    const currentState: Record<string, AnalysisStatus> = {};
    
    // Sammle alle aktuellen Status
    currentAnalytics.forEach(analysis => {
      currentState[analysis.analytics_id] = analysis.status;
      
      // Prüfe, ob sich der Status geändert hat
      if (previousAnalyticsState[analysis.analytics_id] && 
          previousAnalyticsState[analysis.analytics_id] !== analysis.status) {
        
        // Zeige Toast-Benachrichtigung bei Statusänderung an
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
    
    // Aktualisiere den gespeicherten Zustand
    setPreviousAnalyticsState(currentState);
  };

  // Hilfsfunktion für den Analysentyp-Label
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

  // Lädt die Analysedaten vom Server
  const loadAnalytics = async () => {
    // Wenn kein Nutzer eingeloggt ist, keine Analysen abfragen
    if (!user || !authToken) return;
    
    try {
      setLoadingAnalytics(true);
      const data = await analyticsApi.getUserAnalytics();
      
      // Prüfe auf Statusänderungen und zeige Benachrichtigungen an
      checkForStatusChanges(data);
      
      setAnalytics(data);
      
      // Passe das Intervall basierend auf aktiven Analysen an
      setupPollingInterval(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Nur einen Toast anzeigen, wenn der Nutzer eingeloggt ist
      if (user && authToken) {
        toast.error('Analysen konnten nicht geladen werden.');
      }
    } finally {
      setLoadingAnalytics(false);
    }
  };
  
  // Richtet das passende Abfrageintervall ein
  const setupPollingInterval = (currentAnalytics: SensorAnalytics[]) => {
    // Bestimme das passende Intervall basierend auf aktiven Analysen
    const interval = hasActiveAnalysis(currentAnalytics) ? ACTIVE_INTERVAL : REGULAR_INTERVAL;
    
    // Entferne das alte Intervall, falls vorhanden
    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current);
    }
    
    // Setze ein neues Intervall
    intervalIdRef.current = window.setInterval(loadAnalytics, interval);
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
        // Aktualisiere Analysen und setze auf kürzeres Abfrageintervall
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
        // Aktualisiere Analysen und passe Abfrageintervall an
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

  // Effekt für initiales Laden und Abfrage-Intervall
  useEffect(() => {
    // Nur laden, wenn ein Nutzer eingeloggt ist
    if (user && authToken) {
      loadAnalytics();
    }
    
    // Cleanup-Funktion zum Entfernen des Intervalls beim Unmounten
    return () => {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [user, authToken]); // Erneut ausführen, wenn sich der Anmeldestatus ändert

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