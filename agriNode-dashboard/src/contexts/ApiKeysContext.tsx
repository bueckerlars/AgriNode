import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiKey } from '@/types/api';
import apiKeyApi from '@/api/apiKeyApi';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ApiKeysContextType {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  fetchApiKeys: () => Promise<void>;
  createApiKey: (name: string) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;
}

const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined);

export const useApiKeys = (): ApiKeysContextType => {
  const context = useContext(ApiKeysContext);
  if (!context) throw new Error('useApiKeys must be used within ApiKeysProvider');
  return context;
};

interface ProviderProps { children: ReactNode; }
export const ApiKeysProvider: React.FC<ProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const keys = await apiKeyApi.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden der API-Schlüssel');
      toast.error('Fehler beim Laden der API-Schlüssel');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (name: string) => {
    try {
      setLoading(true);
      const key = await apiKeyApi.createApiKey(name);
      setApiKeys(prev => [...prev, key]);
      toast.success('API-Schlüssel erstellt');
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Erstellen des API-Schlüssels');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      setLoading(true);
      await apiKeyApi.deleteApiKey(id);
      setApiKeys(prev => prev.filter(k => k.api_key_id !== id));
      toast.success('API-Schlüssel gelöscht');
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Löschen des API-Schlüssels');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  return (
    <ApiKeysContext.Provider value={{ apiKeys, loading, error, fetchApiKeys, createApiKey, deleteApiKey }}>
      {children}
    </ApiKeysContext.Provider>
  );
};