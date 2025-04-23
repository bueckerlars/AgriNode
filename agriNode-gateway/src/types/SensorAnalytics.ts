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

export interface SensorAnalytics {
  analytics_id: string;
  sensor_id: string;
  user_id: string;
  status: AnalysisStatus;
  type: AnalysisType;
  parameters: {
    timeRange: {
      start: string;
      end: string;
    };
    [key: string]: any;
  };
  result?: any;
  created_at: Date;
  updated_at: Date;
}