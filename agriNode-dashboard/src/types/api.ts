// API-Typen basierend auf der OpenAPI-Spezifikation

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Sensor {
  sensor_id?: string;
  user_id: string;
  name: string;
  type: string;
  location?: string;
  unique_device_id: string;
  registered_at?: Date;
  updated_at?: Date;
  batteryLevel?: number;
  firmware_version?: string;
}

export interface SensorData {
  data_id: string;
  sensor_id: string;
  timestamp: string;
  air_humidity?: number;
  air_temperature?: number;
  soil_moisture?: number;
  soil_temperature?: number;
  brightness?: number;
  battery_level: number;
}

export interface ApiKey {
  api_key_id: string;
  user_id: string;
  name: string;
  key: string;
  created_at: string;
  expiration_date: string | null;
}

// Auth-Request-Typen
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// Sensor-Request-Typen
export interface RegisterSensorRequest {
  name: string;
  location?: string;
  unique_device_id: string;
  type: string;
}

export interface UpdateSensorRequest {
  name?: string;
  location?: string;
}

// SensorData-Request-Typen
export interface CreateSensorDataRequest {
  sensor_id: string;
  timestamp?: string;
  air_humidity?: number;
  air_temperature?: number;
  soil_moisture?: number;
  soil_temperature?: number;
  brightness?: number;
  battery_level: number;
}

export interface UpdateSensorDataRequest {
  timestamp?: string;
  air_humidity?: number;
  air_temperature?: number;
  soil_moisture?: number;
  soil_temperature?: number;
  brightness?: number;
  battery_level?: number;
}

// Auth-Response-Typen
export interface AuthResponse {
  accessToken: string;
}

// User-Request-Typen
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'admin' | 'user';
  active?: boolean;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresIn?: number; // Duration in seconds
}
