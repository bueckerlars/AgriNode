import { AnalysisStatus, AnalysisType, SensorType, TimeRange } from './base.types';

export interface ProgressStep {
    index: number;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
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
        timeRange: TimeRange;
        [key: string]: any;
    };
    progress?: ProgressInfo;
    result?: any;
    created_at: Date;
    updated_at: Date;
}

export interface SensorDataPoint {
    timestamp: string;
    measurements: {
        temperature?: number;
        humidity?: number;
        brightness?: number;
        soilMoisture?: number;
    };
}

export interface SensorDataAnalysisRequest {
    sensorData: SensorDataPoint[];
    timeRange: TimeRange;
    analysisType: AnalysisType;
    model?: string;
}

export interface SensorTypeAnalysis {
    sensorType: SensorType;
    summary: string;
    trends: {
        type: string;
        description: string;
        confidence: number;
    }[];
    anomalies: {
        timestamp: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
    }[];
    recommendations: string[];
}

export interface AnalysisResponse {
    overallSummary: string;
    sensorAnalyses: SensorTypeAnalysis[];
    correlations: {
        description: string;
        sensorTypes: string[];
        confidence: number;
    }[];
    metadata: {
        modelUsed: string;
        analysisTimestamp: string;
        dataPointsAnalyzed: number;
    };
}

export interface CreateAnalyticsRequest {
    sensorId: string;
    type: AnalysisType;
    parameters: {
        timeRange: TimeRange;
        [key: string]: any;
    };
} 