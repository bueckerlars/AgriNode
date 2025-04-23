import { apiClient } from './apiClient';

interface OllamaStatus {
  status: 'connected' | 'disconnected';
  message: string;
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
  }
};