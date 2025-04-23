import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ollamaApi } from '@/api/ollamaApi';

interface OllamaModel {
  name: string;
  description: string;
}

interface OllamaContextType {
  isConnected: boolean;
  statusMessage: string;
  loading: boolean;
  availableModels: OllamaModel[];
  loadingModels: boolean;
  checkOllamaStatus: () => Promise<void>;
  fetchAvailableModels: () => Promise<OllamaModel[]>;
}

const OllamaContext = createContext<OllamaContextType | undefined>(undefined);

export const OllamaProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);

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
        checkOllamaStatus,
        fetchAvailableModels
      }}
    >
      {children}
    </OllamaContext.Provider>
  );
};

export const useOllama = () => {
  const context = useContext(OllamaContext);
  if (context === undefined) {
    throw new Error('useOllama must be used within an OllamaProvider');
  }
  return context;
};