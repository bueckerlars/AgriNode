export interface SensorDataPoint {
    timestamp: string;
    measurements: {
        temperature?: number;
        humidity?: number;
        brightness?: number;
        soilMoisture?: number;
    };
}

export interface TimeRange {
    start: string;
    end: string;
}

export interface SensorDataAnalysisRequest {
    sensorData: SensorDataPoint[];
    timeRange: TimeRange;
    analysisType: 'trend' | 'anomaly' | 'forecast';
}

export interface SensorTypeAnalysis {
    sensorType: 'temperature' | 'humidity' | 'brightness' | 'soilMoisture';
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