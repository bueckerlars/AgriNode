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
  startTime?: Date;   // Zeitpunkt, wann der Schritt gestartet wurde
  endTime?: Date;     // Zeitpunkt, wann der Schritt abgeschlossen wurde
  duration?: number;  // Dauer in Millisekunden
}

export interface ProgressInfo {
  totalSteps: number;
  currentStep: number;
  steps: ProgressStep[];
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
  progress?: ProgressInfo;
  result?: any;
  created_at: Date;
  updated_at: Date;
}