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

// SensorAnalytics types
export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum AnalysisType {
  TREND = 'trend',
  ANOMALY = 'anomaly',
  FORECAST = 'forecast'
}

export interface ProgressStep {
  index: number;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime?: string;  // ISO-String für Frontend-Kompatibilität
  endTime?: string;    // ISO-String für Frontend-Kompatibilität
  duration?: number;   // Dauer in Millisekunden
}

export interface ProgressInfo {
  totalSteps: number;
  currentStep: number;
  steps: ProgressStep[];
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface SensorAnalytics {
  analytics_id: string;
  sensor_id: string;
  user_id: string;
  status: AnalysisStatus;
  type: AnalysisType;
  parameters: {
    timeRange: TimeRange;
    [key: string]: any;
  };
  progress?: ProgressInfo;
  result?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateAnalyticsRequest {
  sensor_id: string;
  type: AnalysisType;
  parameters: {
    timeRange: TimeRange;
    model?: string; // Optional model parameter to specify which LLM to use
    [key: string]: any;
  };
}
