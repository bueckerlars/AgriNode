import Ollama from 'ollama';
import { SensorDataAnalysisRequest, AnalysisResponse, SensorTypeAnalysis, SensorDataPoint } from '../types/ollama.types';

type SensorType = 'temperature' | 'humidity' | 'brightness' | 'soilMoisture';

interface SingleSensorData {
    timestamp: string;
    value: number;
}

interface SensorTypeInfo {
    unit: string;
    optimalRange: string;
    criticalLow: string;
    criticalHigh: string;
    description: string;
}

type SensorTypeInfoMap = {
    [K in SensorType]: SensorTypeInfo;
};

export class OllamaService {
    private ollama: typeof Ollama;
    private readonly DEFAULT_MODEL = 'deepseek-r1:8b';
    private readonly SENSOR_TYPES: SensorType[] = ['temperature', 'humidity', 'brightness', 'soilMoisture'];

    private readonly sensorTypeInfo: SensorTypeInfoMap = {
        temperature: {
            unit: '°C',
            optimalRange: '18-24°C',
            criticalLow: '15°C',
            criticalHigh: '28°C',
            description: 'Indoor room temperature for houseplants'
        },
        humidity: {
            unit: '%',
            optimalRange: '40-60%',
            criticalLow: '30%',
            criticalHigh: '70%',
            description: 'Indoor air humidity for houseplants'
        },
        brightness: {
            unit: 'Lux',
            optimalRange: '1000-3000 Lux',
            criticalLow: '500 Lux',
            criticalHigh: '5000 Lux',
            description: 'Indoor light levels for houseplants'
        },
        soilMoisture: {
            unit: '%',
            optimalRange: '40-60%',
            criticalLow: '20%',
            criticalHigh: '80%',
            description: 'Soil moisture levels for houseplants'
        }
    };

    constructor() {
        this.ollama = Ollama;
    }

    async checkStatus(): Promise<{status: 'connected' | 'disconnected', message: string}> {
        try {
            await this.ollama.list();
            return {
                status: 'connected',
                message: 'Verbindung zum Ollama-Dienst hergestellt'
            };
        } catch (error) {
            console.error('Error connecting to Ollama service:', error);
            return {
                status: 'disconnected',
                message: 'Verbindung zum Ollama-Dienst konnte nicht hergestellt werden'
            };
        }
    }

    async getAvailableModels(): Promise<{ name: string, description: string }[]> {
        try {
            const models = await this.ollama.list();
            return models.models.map(model => ({
                name: model.name,
                description: model.details?.parameter_size 
                    ? `${model.name} (${model.details.parameter_size})`
                    : model.name
            }));
        } catch (error) {
            console.error('Error fetching available models:', error);
            return [
                { name: this.DEFAULT_MODEL, description: this.DEFAULT_MODEL }
            ];
        }
    }

    async analyzeSensorData(request: SensorDataAnalysisRequest): Promise<AnalysisResponse> {
        try {
            const availableSensorTypes = this.getAvailableSensorTypes(request.sensorData);
            const model = request.model || this.DEFAULT_MODEL;
            
            const sensorAnalyses = await Promise.all(
                availableSensorTypes.map(sensorType => 
                    this.analyzeSingleSensorType(request, sensorType as SensorType, model)
                )
            );

            const correlations = await this.analyzeCorrelations(request.sensorData, availableSensorTypes, model);

            const response = await this.ollama.generate({
                model: model,
                prompt: this.buildOverallSummaryPrompt(sensorAnalyses, correlations),
                format: {
                    type: "object",
                    properties: {
                        summary: {
                            type: "string",
                            description: "Zusammenfassende Analyse der Umweltbedingungen"
                        }
                    },
                    required: ["summary"]
                },
                system: 'You are an expert in analyzing agricultural sensor data. Create a comprehensive summary of the individual analyses and provide an overall assessment. Respond ONLY with a JSON object in German.'
            });

            return {
                overallSummary: JSON.parse(response.response).summary,
                sensorAnalyses,
                correlations,
                metadata: {
                    modelUsed: model,
                    analysisTimestamp: new Date().toISOString(),
                    dataPointsAnalyzed: request.sensorData.length * availableSensorTypes.length
                }
            };
        } catch (error) {
            console.error('Error analyzing sensor data:', error);
            throw new Error('Failed to analyze sensor data');
        }
    }

    private getAvailableSensorTypes(sensorData: SensorDataPoint[]): SensorType[] {
        const availableTypes = new Set<SensorType>();
        
        sensorData.forEach(dataPoint => {
            Object.entries(dataPoint.measurements).forEach(([type, value]) => {
                if (value !== undefined && this.SENSOR_TYPES.includes(type as SensorType)) {
                    availableTypes.add(type as SensorType);
                }
            });
        });

        return Array.from(availableTypes);
    }

    private async analyzeSingleSensorType(
        request: SensorDataAnalysisRequest,
        sensorType: SensorType,
        model: string
    ): Promise<SensorTypeAnalysis> {
        const sensorData: SingleSensorData[] = request.sensorData
            .map(dataPoint => ({
                timestamp: dataPoint.timestamp,
                value: dataPoint.measurements[sensorType]
            }))
            .filter((data): data is SingleSensorData => data.value !== undefined);

        const prompt = this.buildSingleSensorAnalysisPrompt(sensorData, sensorType, request.analysisType);
        
        const response = await this.ollama.generate({
            model: model,
            prompt,
            format: {
                type: "object",
                properties: {
                    summary: {
                        type: "string",
                        description: `Zusammenfassende Analyse der ${sensorType}-Daten`
                    },
                    trends: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    description: "steigend|fallend|stabil"
                                },
                                description: {
                                    type: "string",
                                    description: "Detaillierte Beschreibung des Trends"
                                },
                                confidence: {
                                    type: "number",
                                    description: "Confidence level"
                                }
                            },
                            required: ["type", "description", "confidence"]
                        }
                    },
                    anomalies: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                timestamp: {
                                    type: "string",
                                    description: "Timestamp of anomaly"
                                },
                                description: {
                                    type: "string",
                                    description: "Beschreibung der Anomalie"
                                },
                                severity: {
                                    type: "string",
                                    description: "low|medium|high"
                                }
                            },
                            required: ["timestamp", "description", "severity"]
                        }
                    },
                    recommendations: {
                        type: "array",
                        items: {
                            type: "string",
                            description: "Konkrete Handlungsempfehlung basierend auf den Analyseergebnissen"
                        }
                    }
                },
                required: ["summary", "trends", "anomalies", "recommendations"]
            },
            system: `You are an expert in analyzing ${sensorType} data in agriculture. Analyze the data and provide detailed insights. Respond ONLY with a JSON object in German.`
        });

        return {
            sensorType,
            ...JSON.parse(response.response)
        };
    }

    private async analyzeCorrelations(
        sensorData: SensorDataPoint[],
        sensorTypes: string[],
        model: string
    ) {
        if (sensorTypes.length < 2) {
            return [];
        }

        const prompt = this.buildCorrelationAnalysisPrompt(sensorData, sensorTypes);
        
        const response = await this.ollama.generate({
            model: model,
            prompt,
            format: {
                type: "object",
                properties: {
                    correlations: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                description: {
                                    type: "string",
                                    description: "Beschreibung des Zusammenhangs zwischen den Messgrößen"
                                },
                                sensorTypes: {
                                    type: "array",
                                    items: {
                                        type: "string",
                                        description: "Sensor types involved in correlation"
                                    }
                                },
                                confidence: {
                                    type: "number",
                                    description: "Confidence level"
                                }
                            },
                            required: ["description", "sensorTypes", "confidence"]
                        }
                    }
                },
                required: ["correlations"]
            },
            system: 'You are an expert in analyzing relationships between different environmental factors in agriculture. Respond ONLY with a JSON object in German.'
        });

        return JSON.parse(response.response).correlations;
    }

    private buildSingleSensorAnalysisPrompt(
        sensorData: SingleSensorData[],
        sensorType: SensorType,
        analysisType: string
    ): string {
        const info = this.sensorTypeInfo[sensorType];
        
        return `
            Analyze the following ${sensorType} data for indoor houseplants:
            ${JSON.stringify(sensorData, null, 2)}
            
            Analysis type: ${analysisType}
            Measurement: ${info.description}
            Unit: ${info.unit}
            Optimal indoor range: ${info.optimalRange}
            Critical thresholds: < ${info.criticalLow}, > ${info.criticalHigh}
            
            Context:
            - Data is collected from indoor environment
            - Focused on houseplant health monitoring
            - Consider typical indoor conditions and daily fluctuations
            
            Create a detailed analysis including:
            - Summary of measurements in context of optimal indoor ranges
            - Identified trends with confidence levels (considering indoor patterns)
            - Anomalies with severity levels (in context of houseplant requirements)
            - Specific recommendations for indoor plant care optimization
            
            The response MUST exactly match the provided JSON format and be in German.
        `;
    }

    private buildCorrelationAnalysisPrompt(
        sensorData: SensorDataPoint[],
        sensorTypes: string[]
    ): string {
        return `
            Analyze the correlations between the following indoor sensor data:
            ${JSON.stringify(sensorData, null, 2)}
            
            Available sensor types: ${sensorTypes.join(', ')}
            
            Consider these indoor environment relationships:
            - Temperature <-> Humidity (inverse correlation, affected by heating/AC)
            - Brightness <-> Temperature (mild correlation due to indoor lighting and window exposure)
            - Soil Moisture <-> Humidity (weak correlation in indoor settings)
            - Temperature <-> Soil Moisture (increased evaporation with higher indoor temperatures)
            
            Indoor-specific factors to consider:
            - Daily heating/cooling cycles
            - Impact of ventilation
            - Effect of artificial lighting
            - Indoor humidity management
            
            Identify the strongest relationships and assess their significance for indoor plant health.
            The response MUST exactly match the provided JSON format and be in German.
        `;
    }

    private buildOverallSummaryPrompt(
        sensorAnalyses: SensorTypeAnalysis[],
        correlations: any[]
    ): string {
        return `
            Create a comprehensive summary based on the following indoor environment analyses:
            
            Sensor analyses:
            ${JSON.stringify(sensorAnalyses, null, 2)}
            
            Detected correlations:
            ${JSON.stringify(correlations, null, 2)}
            
            Consider these indoor environment aspects:
            - Overall state of indoor growing conditions
            - Impact of building climate control
            - Daily and seasonal patterns
            - Window exposure and artificial lighting
            - Air circulation and ventilation
            
            Provide recommendations for:
            - Optimal placement of plants
            - Ventilation adjustments
            - Watering schedule optimization
            - Lighting improvements
            - Humidity management
            
            The response MUST exactly match the provided JSON format and be in German.
        `;
    }
}