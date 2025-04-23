import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ollamaApi } from '@/api/ollamaApi';

interface OllamaContextType {
  isConnected: boolean;
  statusMessage: string;
  loading: boolean;
  checkOllamaStatus: () => Promise<void>;
}

const OllamaContext = createContext<OllamaContextType | undefined>(undefined);

export const OllamaProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const checkOllamaStatus = async () => {
    setLoading(true);
    try {
      const status = await ollamaApi.checkStatus();
      setIsConnected(status.status === 'connected');
      setStatusMessage(status.message);
    } catch (error) {
      setIsConnected(false);
      setStatusMessage('Fehler bei der Kommunikation mit dem Ollama-Dienst');
    } finally {
      setLoading(false);
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
        checkOllamaStatus
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