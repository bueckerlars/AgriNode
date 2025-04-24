import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ollamaApi, OllamaInstance, WebSocketMessage, RegisterInstanceParams } from '@/api/ollamaApi';
import { useAuth } from './AuthContext';
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
  wsConnected: boolean;
  wsConnecting: boolean;
  instances: OllamaInstance[];
  loadingInstances: boolean;
  activeInstanceId: string | null;
  checkOllamaStatus: () => Promise<void>;
  fetchAvailableModels: () => Promise<OllamaModel[]>;
  getModelDetails: (modelName: string) => Promise<ModelDetails | null>;
  installModel: (params: ModelInstallParams) => Promise<boolean>;
  deleteModel: (modelName: string) => Promise<boolean>;
  checkInstallProgress: (modelName: string) => Promise<void>;
  cancelModelInstallation: (modelName: string) => Promise<boolean>;
  connectToWebSocket: () => void;
  disconnectFromWebSocket: () => void;
  fetchUserInstances: () => Promise<OllamaInstance[]>;
  registerInstance: (params: RegisterInstanceParams) => void;
  removeInstance: (instanceId: string) => void;
  setDefaultInstance: (instanceId: string) => void;
  checkInstanceConnection: (instanceId: string) => void;
  setActiveInstance: (instanceId: string | null) => void;
}

const defaultContextValue: OllamaContextType = {
  isConnected: false,
  statusMessage: '',
  loading: false,
  availableModels: [],
  loadingModels: false,
  modelDetails: null,
  loadingModelDetails: false,
  installProgress: {},
  wsConnected: false,
  wsConnecting: false,
  instances: [],
  loadingInstances: false,
  activeInstanceId: null,
  checkOllamaStatus: async () => {},
  fetchAvailableModels: async () => [],
  getModelDetails: async () => null,
  installModel: async () => false,
  deleteModel: async () => false,
  checkInstallProgress: async () => {},
  cancelModelInstallation: async () => false,
  connectToWebSocket: () => {},
  disconnectFromWebSocket: () => {},
  fetchUserInstances: async () => [],
  registerInstance: () => {},
  removeInstance: () => {},
  setDefaultInstance: () => {},
  checkInstanceConnection: () => {},
  setActiveInstance: () => {}
};

export const OllamaContext = createContext<OllamaContextType>(defaultContextValue);

export const OllamaProvider = ({ children }: { children: ReactNode }) => {
  const { user, authToken } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [modelDetails, setModelDetails] = useState<ModelDetails | null>(null);
  const [loadingModelDetails, setLoadingModelDetails] = useState<boolean>(false);
  const [installProgress, setInstallProgress] = useState<Record<string, ModelInstallProgress>>({});
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsConnecting, setWsConnecting] = useState<boolean>(false);
  const [instances, setInstances] = useState<OllamaInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState<boolean>(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  const checkOllamaStatus = async () => {
    setLoading(true);
    try {
      const instanceIdParam = activeInstanceId || undefined;
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
      const instanceIdParam = activeInstanceId || undefined;
      const models = await ollamaApi.getAvailableModels(instanceIdParam);
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
      const instanceIdParam = activeInstanceId || undefined;
      const details = await ollamaApi.getModelDetails(modelName, instanceIdParam);
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
    setInstallProgress(prev => ({
      ...prev,
      [params.name]: { status: 'starting', progress: 0, completed: false }
    }));
    try {
      const instanceIdParam = activeInstanceId || undefined;
      const success = await ollamaApi.installModel(params, instanceIdParam);
      if (success) {
        setInstallProgress(prev => ({
          ...prev,
          [params.name]: { status: 'downloading', progress: 0.1, completed: false }
        }));
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
          await fetchAvailableModels();
        } else {
          let progress = 0.5;
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
          setTimeout(() => checkInstallProgress(modelName), 2000);
        }
      } else {
        const models = await fetchAvailableModels();
        const isInstalled = models.some(model => model.name === modelName);
        if (isInstalled) {
          setInstallProgress(prev => ({
            ...prev,
            [modelName]: { status: 'completed', progress: 1, completed: true }
          }));
        } else {
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
      const instanceIdParam = activeInstanceId || undefined;
      const success = await ollamaApi.deleteModel(modelName, instanceIdParam);
      if (success) {
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

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('WebSocket message received:', message);
    switch (message.type) {
      case 'authenticated':
        toast.success('WebSocket-Verbindung authentifiziert');
        if (message.payload.instances) {
          setInstances(message.payload.instances);
        }
        break;
      case 'instanceRegistered':
        toast.success('Ollama-Instanz erfolgreich registriert');
        if (message.payload.instance) {
          setInstances(prev => [...prev, message.payload.instance]);
        }
        break;
      case 'instanceRemoved':
        toast.success('Ollama-Instanz erfolgreich entfernt');
        if (message.payload.instanceId) {
          setInstances(prev => prev.filter(inst => inst.id !== message.payload.instanceId));
          if (activeInstanceId === message.payload.instanceId) {
            setActiveInstanceId(null);
          }
        }
        break;
      case 'defaultInstanceSet':
        toast.success('Standardinstanz gesetzt');
        if (message.payload.instances) {
          setInstances(message.payload.instances);
        }
        break;
      case 'connectionStatus':
        const isConnected = message.payload.connected;
        if (isConnected) {
          toast.success('Verbindung zur Ollama-Instanz hergestellt');
        } else {
          toast.error('Verbindung zur Ollama-Instanz konnte nicht hergestellt werden');
        }
        if (message.payload.instance) {
          setInstances(prev => 
            prev.map(inst => inst.id === message.payload.instanceId 
              ? { ...inst, isConnected: message.payload.connected } 
              : inst
            )
          );
        }
        break;
      case 'instancesList':
        if (message.payload.instances) {
          setInstances(message.payload.instances);
        }
        break;
      case 'error':
        toast.error(`Fehler: ${message.payload.message}`);
        break;
    }
  };

  const connectToWebSocket = () => {
    if (wsConnected || wsConnecting) return;
    setWsConnecting(true);
    ollamaApi.connectWebSocket({
      onOpen: () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        setWsConnecting(false);
        if (user && authToken) {
          ollamaApi.authenticateWebSocket(authToken);
        }
      },
      onMessage: handleWebSocketMessage,
      onClose: () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        setWsConnecting(false);
        toast.error('Fehler bei der WebSocket-Verbindung');
      }
    });
  };

  const disconnectFromWebSocket = () => {
    ollamaApi.disconnectWebSocket();
    setWsConnected(false);
    setWsConnecting(false);
  };

  const fetchUserInstances = async () => {
    if (!user) return [];
    setLoadingInstances(true);
    try {
      if (wsConnected) {
        ollamaApi.listInstances();
      } else {
        const userInstances = await ollamaApi.getUserInstances();
        setInstances(userInstances);
        return userInstances;
      }
      return instances;
    } catch (error) {
      console.error('Fehler beim Abrufen der Ollama-Instanzen:', error);
      return [];
    } finally {
      setLoadingInstances(false);
    }
  };

  const registerInstance = (params: RegisterInstanceParams) => {
    if (!wsConnected) {
      toast.error('Keine WebSocket-Verbindung');
      return;
    }
    ollamaApi.registerOllamaInstance(params);
  };

  const removeInstance = (instanceId: string) => {
    if (!wsConnected) {
      toast.error('Keine WebSocket-Verbindung');
      return;
    }
    ollamaApi.removeOllamaInstance(instanceId);
  };

  const setDefaultInstance = (instanceId: string) => {
    if (!wsConnected) {
      toast.error('Keine WebSocket-Verbindung');
      return;
    }
    ollamaApi.setDefaultInstance(instanceId);
  };

  const checkInstanceConnection = (instanceId: string) => {
    if (!wsConnected) {
      toast.error('Keine WebSocket-Verbindung');
      return;
    }
    ollamaApi.checkInstanceConnection(instanceId);
  };

  const setActiveInstance = (instanceId: string | null) => {
    setActiveInstanceId(instanceId);
    if (instanceId !== activeInstanceId) {
      setTimeout(() => {
        checkOllamaStatus();
      }, 100);
    }
  };

  useEffect(() => {
    checkOllamaStatus();
    const intervalId = setInterval(() => {
      checkOllamaStatus();
    }, 60000);
    return () => clearInterval(intervalId);
  }, [activeInstanceId]);

  useEffect(() => {
    if (user && !wsConnected && !wsConnecting) {
      connectToWebSocket();
    }
    return () => {
      if (wsConnected) {
        disconnectFromWebSocket();
      }
    };
  }, [user]);

  useEffect(() => {
    if (wsConnected && authToken) {
      ollamaApi.authenticateWebSocket(authToken);
    }
  }, [wsConnected, authToken]);

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
        wsConnected,
        wsConnecting,
        instances,
        loadingInstances,
        activeInstanceId,
        checkOllamaStatus,
        fetchAvailableModels,
        getModelDetails,
        installModel,
        deleteModel,
        checkInstallProgress,
        cancelModelInstallation,
        connectToWebSocket,
        disconnectFromWebSocket,
        fetchUserInstances,
        registerInstance,
        removeInstance,
        setDefaultInstance,
        checkInstanceConnection,
        setActiveInstance
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

export default OllamaContext;