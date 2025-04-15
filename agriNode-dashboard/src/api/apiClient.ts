import axios from 'axios';

// Bestimme die Base-URL basierend auf der Umgebung
const getBaseUrl = (): string => {
  // Im Development-Modus (Vite dev server)
  if (import.meta.env.DEV) {
    return 'http://localhost:5066/api';
  }
  
  // In der Produktionsumgebung nutzen wir den relativen Pfad für Nginx
  // Nginx leitet dann /api/ an das Gateway weiter (siehe nginx.conf)
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Store the auth token that can be updated by the auth context
let authToken: string | null = null;

// Function to set the auth token (will be called from AuthContext)
export const setAuthTokenForApi = (token: string | null) => {
  authToken = token;
};

// Add a request interceptor to add the auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // If token exists, add it to the headers
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);