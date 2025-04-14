import axios from 'axios';
import { useAuth } from '@/provider/AuthProvider';

// Konfiguriere Axios
axios.defaults.withCredentials = true; // Für Cookie-Handling (Refresh-Token)

const setupAxiosInterceptors = () => {
  const { authToken, refreshAccessToken } = useAuth();

  // Request-Interceptor für das Hinzufügen des Authorization-Headers
  axios.interceptors.request.use(
    (config) => {
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response-Interceptor für das automatische Token-Refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Wenn der Fehler 401 (Unauthorized) ist und wir noch nicht versucht haben,
      // das Token zu aktualisieren (um Endlosschleifen zu vermeiden)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Versuchen, das Token zu aktualisieren
          const response = await refreshAccessToken();
          const { accessToken } = response;

          // Original-Request mit neuem Token wiederholen
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Bei Fehler beim Refresh: Zum Login umleiten
          window.location.href = '/login'; // Hier würde die Login-Seite sein
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

setupAxiosInterceptors();

export default axios;