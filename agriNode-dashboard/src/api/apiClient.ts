import axios from 'axios';

export const apiClient = axios.create({
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