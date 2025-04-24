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

const baseUrl = '/ollama';

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
  getAvailableModels: async (): Promise<OllamaModel[]> => {
    try {
      const response = await apiClient.get<OllamaModelsResponse>(`${baseUrl}/models`);
      return response.data.models || [];
    } catch (error) {
      console.error('Fehler beim Abrufen der verfügbaren Modelle:', error);
      return [];
    }
  },

  // Liefert detaillierte Informationen zu einem Modell
  getModelDetails: async (modelName: string): Promise<ModelDetails | null> => {
    try {
      const response = await apiClient.get<ModelDetails>(`${baseUrl}/models/${encodeURIComponent(modelName)}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Details für Modell ${modelName}:`, error);
      return null;
    }
  },

  // Installiert ein neues Modell
  installModel: async (params: ModelInstallParams): Promise<boolean> => {
    try {
      await apiClient.post(`${baseUrl}/models`, params);
      return true;
    } catch (error) {
      console.error('Fehler bei der Installation des Modells:', error);
      return false;
    }
  },

  // Löscht ein vorhandenes Modell
  deleteModel: async (modelName: string): Promise<boolean> => {
    try {
      await apiClient.delete(`${baseUrl}/models/${encodeURIComponent(modelName)}`);
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
  }
};