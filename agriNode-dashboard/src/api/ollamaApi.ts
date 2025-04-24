import { apiClient } from './apiClient';

interface OllamaStatus {
  status: 'connected' | 'disconnected';
  message: string;
}

interface OllamaModel {
  name: string;
  description: string;
}

interface OllamaModelsResponse {
  models: OllamaModel[];
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

interface InstallProgressResponse {
  status: string;
  completed?: boolean;
  digest?: string;
  total?: number;
  completed_size?: number;
}

// Neue Interfaces für Ollama-Instanzen
export interface OllamaInstance {
  id: string;
  userId: string;
  name: string;
  host: string;
  isDefault: boolean;
  isConnected: boolean;
  lastConnected: Date | null;
  createdAt: Date;
}

export interface OllamaInstancesResponse {
  instances: OllamaInstance[];
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface RegisterInstanceParams {
  host: string;
  name: string;
  makeDefault?: boolean;
}

const baseUrl = '/ollama';

// WebSocket-Verbindung
let ws: WebSocket | null = null;
let connectionId: string | null = null;
let wsCallbacks: {
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: any) => void;
} = {};

// WebSocket-URL mit spezifischem Pfad für Ollama-Instanzen
// Verwende die API_BASE_URL aus der Umgebung oder fallback auf den Server, auf dem die App läuft
const getApiBaseUrl = () => {
  // Wenn eine API_BASE_URL definiert ist (z.B. in der .env), verwende diese
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = new URL(import.meta.env.VITE_API_BASE_URL);
    return url.host;
  }
  
  // Wenn wir in Entwicklung sind, nutze den gleichen Port wie der apiClient (Port 5066)
  if (import.meta.env.DEV) {
    const host = window.location.hostname;
    return `${host}:5066`; // API läuft auf Port 5066 in Entwicklung
  }
  
  // Standard: Verwende den aktuellen Host
  return window.location.host;
};

const wsHost = getApiBaseUrl();
const wsUrl = window.location.protocol === 'https:' ? 
  `wss://${wsHost}/ws/ollama` : 
  `ws://${wsHost}/ws/ollama`;

console.log('WebSocket URL:', wsUrl);

// Hilfsfunktion zum Senden von Nachrichten an den WebSocket-Server
const sendWsMessage = (type: string, payload?: any): boolean => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
    return true;
  }
  return false;
};

export const ollamaApi = {
  // Überprüft den Status der Verbindung zum Ollama-Dienst
  checkStatus: async (): Promise<OllamaStatus> => {
    try {
      const response = await apiClient.get<OllamaStatus>(`${baseUrl}/status`);
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Statusprüfung des Ollama-Dienstes:', error);
      return {
        status: 'disconnected',
        message: 'Verbindung zum Ollama-Dienst konnte nicht hergestellt werden'
      };
    }
  },
  
  // Holt eine Liste der verfügbaren Modelle
  getAvailableModels: async (instanceId?: string): Promise<OllamaModel[]> => {
    try {
      const params = instanceId ? { instanceId } : {};
      const response = await apiClient.get<OllamaModelsResponse>(`${baseUrl}/models`, { params });
      return response.data.models || [];
    } catch (error) {
      console.error('Fehler beim Abrufen der verfügbaren Modelle:', error);
      return [];
    }
  },

  // Liefert detaillierte Informationen zu einem Modell
  getModelDetails: async (modelName: string, instanceId?: string): Promise<ModelDetails | null> => {
    try {
      const params = instanceId ? { instanceId } : {};
      const response = await apiClient.get<ModelDetails>(
        `${baseUrl}/models/${encodeURIComponent(modelName)}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Details für Modell ${modelName}:`, error);
      return null;
    }
  },

  // Installiert ein neues Modell
  installModel: async (params: ModelInstallParams, instanceId?: string): Promise<boolean> => {
    try {
      const queryParams = instanceId ? { instanceId } : {};
      await apiClient.post(`${baseUrl}/models`, params, { params: queryParams });
      return true;
    } catch (error) {
      console.error('Fehler bei der Installation des Modells:', error);
      return false;
    }
  },

  // Löscht ein vorhandenes Modell
  deleteModel: async (modelName: string, instanceId?: string): Promise<boolean> => {
    try {
      const params = instanceId ? { instanceId } : {};
      await apiClient.delete(`${baseUrl}/models/${encodeURIComponent(modelName)}`, { params });
      return true;
    } catch (error) {
      console.error(`Fehler beim Löschen des Modells ${modelName}:`, error);
      return false;
    }
  },

  // Bricht eine laufende Modell-Installation ab
  cancelInstallation: async (modelName: string): Promise<boolean> => {
    try {
      await apiClient.delete(`${baseUrl}/models/${encodeURIComponent(modelName)}/progress`);
      return true;
    } catch (error) {
      console.error(`Fehler beim Abbrechen der Installation von ${modelName}:`, error);
      return false;
    }
  },

  // Holt den Status der Modell-Installation
  getInstallProgress: async (modelName: string): Promise<InstallProgressResponse | null> => {
    try {
      const response = await apiClient.get<InstallProgressResponse>(
        `${baseUrl}/models/${encodeURIComponent(modelName)}/progress`
      );
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Installationsstatus für ${modelName}:`, error);
      return null;
    }
  },

  // API-Endpunkt für Ollama-Instanzen (REST API)
  getUserInstances: async (): Promise<OllamaInstance[]> => {
    try {
      const response = await apiClient.get<OllamaInstancesResponse>(`${baseUrl}/instances`);
      return response.data.instances || [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Ollama-Instanzen:', error);
      return [];
    }
  },

  // REST-API-Methode zum Initiieren der WebSocket-Verbindung
  initWebSocketConnection: async (): Promise<boolean> => {
    try {
      await apiClient.post(`${baseUrl}/ws/init`);
      return true;
    } catch (error) {
      console.error('Fehler bei der WebSocket-Initialisierung:', error);
      return false;
    }
  },

  // WebSocket-Methoden für die Instanzverwaltung
  connectWebSocket: (callbacks: {
    onMessage?: (message: WebSocketMessage) => void,
    onOpen?: () => void,
    onClose?: () => void,
    onError?: (error: any) => void
  }): void => {
    // Callbacks speichern
    wsCallbacks = callbacks;

    // Wenn bereits eine Verbindung besteht, diese schließen
    if (ws) {
      ws.close();
    }

    // Zuerst REST-API aufrufen, um die WebSocket-Verbindung zu initialisieren
    ollamaApi.initWebSocketConnection()
      .then(() => {
        console.log("WebSocket-Initialisierung erfolgreich, stelle Verbindung her...");
        
        // Neue WebSocket-Verbindung erstellen
        ws = new WebSocket(wsUrl);
        
        // Timeout für WebSocket-Verbindung setzen
        const connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timeout');
            ws.close();
            if (wsCallbacks.onError) {
              wsCallbacks.onError(new Error('WebSocket-Verbindungs-Timeout - konnte keine Verbindung herstellen'));
            }
          }
        }, 10000); // 10 Sekunden Timeout
        
        ws.onopen = () => {
          console.log('WebSocket connection established');
          clearTimeout(connectionTimeout);
          if (wsCallbacks.onOpen) {
            wsCallbacks.onOpen();
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            
            // Beim ersten Verbindungsaufbau setzen wir die connectionId
            if (data.type === 'welcome') {
              connectionId = data.payload.connectionId;
              console.log('WebSocket connected with ID:', connectionId);
            }
            
            if (wsCallbacks.onMessage) {
              wsCallbacks.onMessage(data);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          clearTimeout(connectionTimeout);
          ws = null;
          connectionId = null;
          console.log('WebSocket connection closed');
          if (wsCallbacks.onClose) {
            wsCallbacks.onClose();
          }
        };
        
        ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket error:', error);
          if (wsCallbacks.onError) {
            wsCallbacks.onError(error);
          }
        };
      })
      .catch(error => {
        console.error('Fehler beim Initialisieren der WebSocket-Verbindung:', error);
        if (wsCallbacks.onError) {
          wsCallbacks.onError(error);
        }
      });
  },

  disconnectWebSocket: (): void => {
    if (ws) {
      ws.close();
      ws = null;
      connectionId = null;
    }
  },

  authenticateWebSocket: (token: string): boolean => {
    return sendWsMessage('authenticate', { token });
  },

  registerOllamaInstance: (params: RegisterInstanceParams): boolean => {
    return sendWsMessage('registerInstance', params);
  },

  removeOllamaInstance: (instanceId: string): boolean => {
    return sendWsMessage('removeInstance', { instanceId });
  },

  setDefaultInstance: (instanceId: string): boolean => {
    return sendWsMessage('setDefaultInstance', { instanceId });
  },

  checkInstanceConnection: (instanceId: string): boolean => {
    return sendWsMessage('checkInstanceConnection', { instanceId });
  },

  listInstances: (): boolean => {
    return sendWsMessage('listInstances');
  },

  isWebSocketConnected: (): boolean => {
    return !!ws && ws.readyState === WebSocket.OPEN;
  }
};