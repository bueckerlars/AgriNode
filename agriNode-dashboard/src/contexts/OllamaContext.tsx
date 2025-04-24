import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ollamaApi } from '@/api/ollamaApi';
import { toast } from 'sonner';

interface OllamaModel {
  name: string;
  description: string;
}

interface ModelDetails {
  name: string;
  modelfile?: string;
  parameters?: number;
  quantization?: string;
  size?: number;
  format?: string;
  families?: string[];
  parameter_size?: string;
}

interface ModelInstallParams {
  name: string;
  modelfile?: string;
  insecure?: boolean;
}

interface ModelInstallProgress {
  status: string;
  progress: number;
  completed: boolean;
}

interface OllamaContextType {
  isConnected: boolean;
  statusMessage: string;
  loading: boolean;
  availableModels: OllamaModel[];
  loadingModels: boolean;
  modelDetails: ModelDetails | null;
  loadingModelDetails: boolean;
  installProgress: Record<string, ModelInstallProgress>;
  checkOllamaStatus: () => Promise<void>;
  fetchAvailableModels: () => Promise<OllamaModel[]>;
  getModelDetails: (modelName: string) => Promise<ModelDetails | null>;
  installModel: (params: ModelInstallParams) => Promise<boolean>;
  deleteModel: (modelName: string) => Promise<boolean>;
  checkInstallProgress: (modelName: string) => Promise<void>;
  cancelModelInstallation: (modelName: string) => Promise<boolean>;
}

// Create a default context value to avoid the undefined check
const defaultContextValue: OllamaContextType = {
  isConnected: false,
  statusMessage: '',
  loading: false,
  availableModels: [],
  loadingModels: false,
  modelDetails: null,
  loadingModelDetails: false,
  installProgress: {},
  checkOllamaStatus: async () => {},
  fetchAvailableModels: async () => [],
  getModelDetails: async () => null,
  installModel: async () => false,
  deleteModel: async () => false,
  checkInstallProgress: async () => {},
  cancelModelInstallation: async () => false
};

export const OllamaContext = createContext<OllamaContextType>(defaultContextValue);

export const OllamaProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [modelDetails, setModelDetails] = useState<ModelDetails | null>(null);
  const [loadingModelDetails, setLoadingModelDetails] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<Record<string, ModelInstallProgress>>({});

  const checkOllamaStatus = async () => {
    setLoading(true);
    try {
      const status = await ollamaApi.checkStatus();
      setIsConnected(status.status === 'connected');
      setStatusMessage(status.message);
      if (status.status === 'connected') {
        fetchAvailableModels();
      }
    } catch (error) {
      setIsConnected(false);
      setStatusMessage('Fehler bei der Kommunikation mit dem Ollama-Dienst');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableModels = async () => {
    if (!isConnected) return [];
    
    setLoadingModels(true);
    try {
      const models = await ollamaApi.getAvailableModels();
      setAvailableModels(models);
      return models;
    } catch (error) {
      console.error('Fehler beim Laden der verfügbaren Modelle:', error);
      return [];
    } finally {
      setLoadingModels(false);
    }
  };

  const getModelDetails = async (modelName: string) => {
    if (!isConnected) return null;

    setLoadingModelDetails(true);
    setModelDetails(null);
    
    try {
      const details = await ollamaApi.getModelDetails(modelName);
      setModelDetails(details);
      return details;
    } catch (error) {
      console.error(`Fehler beim Laden der Details für Modell ${modelName}:`, error);
      return null;
    } finally {
      setLoadingModelDetails(false);
    }
  };

  const installModel = async (params: ModelInstallParams) => {
    if (!isConnected) {
      toast.error('Keine Verbindung zu Ollama');
      return false;
    }

    // Initialisiere den Fortschritt für dieses Modell
    setInstallProgress(prev => ({
      ...prev,
      [params.name]: { status: 'starting', progress: 0, completed: false }
    }));

    try {
      const success = await ollamaApi.installModel(params);
      
      if (success) {
        // Starte die Überprüfung des Installationsfortschritts
        setInstallProgress(prev => ({
          ...prev,
          [params.name]: { status: 'downloading', progress: 0.1, completed: false }
        }));
        
        // Zeitversetzt den Fortschritt überprüfen
        setTimeout(() => checkInstallProgress(params.name), 2000);
        return true;
      } else {
        setInstallProgress(prev => ({
          ...prev,
          [params.name]: { status: 'failed', progress: 0, completed: true }
        }));
        return false;
      }
    } catch (error) {
      console.error('Fehler bei der Modellinstallation:', error);
      setInstallProgress(prev => ({
        ...prev,
        [params.name]: { status: 'failed', progress: 0, completed: true }
      }));
      return false;
    }
  };

  const checkInstallProgress = async (modelName: string) => {
    if (!isConnected) return;

    try {
      const progressInfo = await ollamaApi.getInstallProgress(modelName);
      
      if (progressInfo) {
        if (progressInfo.completed) {
          setInstallProgress(prev => ({
            ...prev,
            [modelName]: { status: 'completed', progress: 1, completed: true }
          }));
          
          // Aktualisiere die Modellliste nach erfolgreicher Installation
          await fetchAvailableModels();
        } else {
          // Berechne den Fortschritt basierend auf der heruntergeladenen Größe
          let progress = 0.5; // Standard-Fortschritt, wenn keine Details verfügbar sind
          
          if (progressInfo.total && progressInfo.completed_size) {
            progress = Math.min(0.99, progressInfo.completed_size / progressInfo.total);
            console.log(`Model ${modelName} download progress: ${progress.toFixed(2)} (${progressInfo.completed_size}/${progressInfo.total} bytes)`);
          }
          
          setInstallProgress(prev => ({
            ...prev,
            [modelName]: { 
              status: progressInfo.status || 'downloading', 
              progress, 
              completed: false 
            }
          }));
          
          // Erneut prüfen in 2 Sekunden
          setTimeout(() => checkInstallProgress(modelName), 2000);
        }
      } else {
        // Wenn der Backend-Service keine Fortschrittsdaten mehr hat (z.B. nach Neustart),
        // überprüfen wir, ob das Modell bereits in der verfügbaren Liste ist
        const models = await fetchAvailableModels();
        const isInstalled = models.some(model => model.name === modelName);
        
        if (isInstalled) {
          // Modell scheint installiert zu sein
          setInstallProgress(prev => ({
            ...prev,
            [modelName]: { status: 'completed', progress: 1, completed: true }
          }));
        } else {
          // Installation scheint fehlgeschlagen zu sein
          setInstallProgress(prev => ({
            ...prev,
            [modelName]: { status: 'failed', progress: 0, completed: true }
          }));
          
          toast.error(`Installation von ${modelName} fehlgeschlagen oder abgebrochen`);
        }
      }
    } catch (error) {
      console.error(`Fehler beim Abrufen des Installationsfortschritts für ${modelName}:`, error);
    }
  };

  const deleteModel = async (modelName: string) => {
    if (!isConnected) {
      toast.error('Keine Verbindung zu Ollama');
      return false;
    }

    try {
      const success = await ollamaApi.deleteModel(modelName);
      
      if (success) {
        // Aktualisiere die Modellliste nach erfolgreicher Löschung
        await fetchAvailableModels();
        toast.success(`Modell ${modelName} erfolgreich gelöscht`);
        return true;
      } else {
        toast.error(`Fehler beim Löschen des Modells ${modelName}`);
        return false;
      }
    } catch (error) {
      console.error(`Fehler beim Löschen des Modells ${modelName}:`, error);
      toast.error(`Fehler beim Löschen des Modells ${modelName}`);
      return false;
    }
  };

  const cancelModelInstallation = async (modelName: string) => {
    if (!isConnected) {
      toast.error('Keine Verbindung zu Ollama');
      return false;
    }

    try {
      const success = await ollamaApi.cancelInstallation(modelName);
      
      if (success) {
        setInstallProgress(prev => ({
          ...prev,
          [modelName]: { status: 'cancelled', progress: 0, completed: true }
        }));
        toast.success(`Installation von ${modelName} erfolgreich abgebrochen`);
        return true;
      } else {
        toast.error(`Fehler beim Abbrechen der Installation von ${modelName}`);
        return false;
      }
    } catch (error) {
      console.error(`Fehler beim Abbrechen der Installation von ${modelName}:`, error);
      toast.error(`Fehler beim Abbrechen der Installation von ${modelName}`);
      return false;
    }
  };

  // Prüfe den Status beim ersten Laden und alle 60 Sekunden
  useEffect(() => {
    checkOllamaStatus();
    
    const intervalId = setInterval(() => {
      checkOllamaStatus();
    }, 60000); // Alle 60 Sekunden
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <OllamaContext.Provider
      value={{
        isConnected,
        statusMessage,
        loading,
        availableModels,
        loadingModels,
        modelDetails,
        loadingModelDetails,
        installProgress,
        checkOllamaStatus,
        fetchAvailableModels,
        getModelDetails,
        installModel,
        deleteModel,
        checkInstallProgress,
        cancelModelInstallation
      }}
    >
      {children}
    </OllamaContext.Provider>
  );
};

export const useOllama = () => {
  const context = useContext(OllamaContext);
  return context;
};

// Add a default export for the context to ensure it's properly loaded
export default OllamaContext;