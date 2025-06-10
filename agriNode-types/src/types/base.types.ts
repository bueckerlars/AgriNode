// Basis-Typen
export type UserRole = 'admin' | 'user';
export type AnalysisType = 'trend' | 'anomaly' | 'forecast';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SharingStatus = 'pending' | 'accepted' | 'rejected';
export type SensorType = 'temperature' | 'humidity' | 'brightness' | 'soilMoisture';

// Zeitbereich für Analysen
export interface TimeRange {
    start: string;
    end: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
} 