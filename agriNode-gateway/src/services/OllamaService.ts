import { Ollama } from 'ollama';
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

interface ModelDetails {
    name: string;
    modelfile?: string;
    parameters?: string; // Geändert zu string, da die API strings zurückgibt
    quantization?: string;
    size?: number;
    format?: string;
    families?: string[];
    parameter_size?: string;
}

interface OllamaModelDetails {
    details?: {
        format?: string;
        family?: string;
        families?: string[];
        parameter_size?: string;
        quantization?: string;
    };
    license?: string;
    modelfile?: string;
    parameters?: string;
    template?: string;
    system?: string;
    size?: number;
}

interface ModelInstallParams {
    name: string;
    modelfile?: string;
    insecure?: boolean;
}

interface ModelInstallProgress {
    status: string;
    completed?: boolean;
    digest?: string;
    total?: number;
    completed_size?: number;
    progress?: number;     // Fortschrittswert von 0 bis 1 für das Frontend
    // Kumulierte Daten über alle Dateien hinweg
    total_downloaded?: number;    // Gesamtgröße aller bisher heruntergeladenen Bytes
    estimated_total_size?: number; // Geschätzte Gesamtgröße (kann sich im Laufe der Zeit ändern)
    file_count?: number;          // Anzahl der bisher heruntergeladenen Dateien
    current_file?: string;        // Digest der aktuellen Datei
    file_progress?: Record<string, { total: number, completed: number }>; // Tracking für einzelne Dateien
}

type SensorTypeInfoMap = {
    [K in SensorType]: SensorTypeInfo;
};

export type ProgressCallback = (phase: string, detail: string, progress: number) => Promise<void>;

export class OllamaService {
    private ollama: Ollama;
    private readonly DEFAULT_MODEL = 'deepseek-r1:8b';
    private readonly SENSOR_TYPES: SensorType[] = ['temperature', 'humidity', 'brightness', 'soilMoisture'];
    private modelInstallProgress: Map<string, ModelInstallProgress> = new Map();
    private activeDownloads: Set<string> = new Set();
    private downloadCancellationFlags: Map<string, boolean> = new Map();

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
        const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        console.log(`Initializing Ollama client with host: ${ollamaHost}`);
        this.ollama = new Ollama({ host: ollamaHost });
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

    async getModelDetails(modelName: string): Promise<ModelDetails | null> {
        try {
            const modelInfo = await this.ollama.show({ model: modelName }) as OllamaModelDetails;
            
            if (!modelInfo) {
                return null;
            }
            
            return {
                name: modelName,
                modelfile: modelInfo.modelfile,
                parameters: modelInfo.parameters,
                quantization: modelInfo.details?.quantization,
                format: modelInfo.details?.format,
                families: modelInfo.details?.families,
                parameter_size: modelInfo.details?.parameter_size,
                size: modelInfo.size
            };
        } catch (error) {
            console.error(`Error getting model details for ${modelName}:`, error);
            return null;
        }
    }

    async installModel(params: ModelInstallParams): Promise<boolean> {
        try {
            // Status im Fortschritts-Map initialisieren
            this.modelInstallProgress.set(params.name, {
                status: 'downloading',
                completed: false,
                total_downloaded: 0,
                estimated_total_size: 0,
                file_count: 0,
                file_progress: {}
            });

            // Markiere den Download als aktiv
            this.activeDownloads.add(params.name);
            this.downloadCancellationFlags.set(params.name, false);

            try {
                // Starten des Pull-Vorgangs mit korrekten Parametern
                const pullStream = await this.ollama.pull({
                    model: params.name,
                    insecure: params.insecure,
                    stream: true
                });
                
                // Wichtig: Den Stream-Verarbeitungsprozess als separaten Promise starten
                this.processPullStream(params.name, pullStream);
                
                return true;
            } catch (error) {
                // Prüfe, ob der Fehler durch das Abbrechen des Requests verursacht wurde
                if (this.downloadCancellationFlags.get(params.name)) {
                    console.log(`Pull for model ${params.name} was cancelled`);
                    this.modelInstallProgress.set(params.name, {
                        status: 'cancelled',
                        completed: true
                    });
                    return false;
                }

                console.error(`Failed to start pull for model ${params.name}:`, error);
                // Bei einem Fehler den Status aktualisieren
                this.modelInstallProgress.set(params.name, {
                    status: 'error',
                    completed: true
                });
                return false;
            } finally {
                // Aufräumen wenn der Request abgeschlossen ist (erfolgreich, abgebrochen oder fehlerhaft)
                setTimeout(() => {
                    // Entferne den Download nach einer Verzögerung
                    this.activeDownloads.delete(params.name);
                    this.downloadCancellationFlags.delete(params.name);
                }, 5000);
            }
        } catch (error) {
            console.error(`Error installing model ${params.name}:`, error);
            this.modelInstallProgress.delete(params.name);
            this.activeDownloads.delete(params.name);
            this.downloadCancellationFlags.delete(params.name);
            return false;
        }
    }

    private async processPullStream(modelName: string, pullStream: AsyncIterable<any>): Promise<void> {
        try {
            for await (const chunk of pullStream) {
                // Prüfe, ob der Download abgebrochen wurde
                if (this.downloadCancellationFlags.get(modelName)) {
                    console.log(`Download for model ${modelName} was cancelled during processing`);
                    this.modelInstallProgress.set(modelName, {
                        status: 'cancelled',
                        completed: true
                    });
                    break;
                }

                // Debug-Ausgabe hinzufügen
                console.log(`Pull stream chunk for ${modelName}:`, JSON.stringify(chunk));
                
                // Ein Download gilt nur als abgeschlossen wenn:
                // 1. completed != null ist
                // 2. status === 'success' ist
                const isReallyCompleted = chunk.completed !== null && 
                                          chunk.completed !== undefined && 
                                          chunk.status === 'success';

                // Hole den aktuellen Fortschritt
                const currentProgress = this.modelInstallProgress.get(modelName) || {
                    status: 'downloading',
                    completed: false,
                    total_downloaded: 0,
                    estimated_total_size: 0,
                    file_count: 0,
                    file_progress: {}
                };
                
                // Falls ein Digest vorhanden ist, verfolge den Fortschritt dieser Datei
                if (chunk.digest) {
                    // Initialisiere die Datei-Verfolgung, falls nicht vorhanden
                    if (!currentProgress.file_progress) {
                        currentProgress.file_progress = {};
                    }

                    // Setze den aktuellen Datei-Digest
                    currentProgress.current_file = chunk.digest;

                    // Initialisiere oder aktualisiere den Datei-Fortschritt
                    if (!currentProgress.file_progress[chunk.digest]) {
                        currentProgress.file_progress[chunk.digest] = {
                            total: chunk.total || 0,
                            completed: chunk.completed_size || 0
                        };

                        // Erhöhe die Anzahl der Dateien, wenn diese neu ist
                        currentProgress.file_count = (currentProgress.file_count || 0) + 1;
                    } else {
                        // Aktualisiere den Fortschritt für eine bereits bekannte Datei
                        if (chunk.total) {
                            currentProgress.file_progress[chunk.digest].total = chunk.total;
                        }
                        if (chunk.completed_size !== undefined) {
                            // Berechne den Unterschied zwischen neuem und altem Wert
                            const oldCompleted = currentProgress.file_progress[chunk.digest].completed;
                            const newCompleted = chunk.completed_size;
                            const downloadedDiff = newCompleted - oldCompleted;
                            
                            // Aktualisiere die heruntergeladenen Bytes für diese Datei
                            currentProgress.file_progress[chunk.digest].completed = newCompleted;
                            
                            // Füge die neu heruntergeladenen Bytes zum Gesamt-Download hinzu
                            if (downloadedDiff > 0) {
                                currentProgress.total_downloaded = (currentProgress.total_downloaded || 0) + downloadedDiff;
                            }
                        }
                    }

                    // Aktualisiere die geschätzte Gesamtgröße
                    let estimatedTotal = 0;
                    Object.values(currentProgress.file_progress).forEach(file => {
                        estimatedTotal += file.total;
                    });
                    currentProgress.estimated_total_size = estimatedTotal;

                    // Berechne den Gesamtfortschritt
                    const totalDownloaded = currentProgress.total_downloaded || 0;
                    const estimatedSize = currentProgress.estimated_total_size || 1; // Verhindere Division durch 0
                    
                    // Hier aktualisieren wir completed_size und total für die Kompatibilität mit dem Frontend
                    currentProgress.completed_size = totalDownloaded;
                    currentProgress.total = estimatedSize;
                }
                
                // Aktualisiere den Status basierend auf dem Chunk
                currentProgress.status = chunk.status || 'downloading';
                currentProgress.completed = isReallyCompleted;
                
                // Speichere den aktualisierten Fortschritt zurück in die Map
                this.modelInstallProgress.set(modelName, currentProgress);

                // Nur ausbrechen wenn wirklich abgeschlossen
                if (isReallyCompleted) {
                    console.log(`Model ${modelName} installation fully completed: status=${chunk.status}, completed=${chunk.completed}`);
                    // Setze den finalen Status
                    this.modelInstallProgress.set(modelName, {
                        ...currentProgress,
                        status: 'success',
                        completed: true,
                        progress: 1.0
                    });
                    break;
                }
            }
        } catch (error) {
            console.error(`Error during model installation stream processing for ${modelName}:`, error);
            // Status auf Fehler setzen
            this.modelInstallProgress.set(modelName, {
                status: 'error',
                completed: true
            });
        }
    }

    async deleteModel(modelName: string): Promise<boolean> {
        try {
            await this.ollama.delete({
                model: modelName
            });
            return true;
        } catch (error) {
            console.error(`Error deleting model ${modelName}:`, error);
            return false;
        }
    }

    async getModelInstallProgress(modelName: string): Promise<ModelInstallProgress | null> {
        const progress = this.modelInstallProgress.get(modelName);
        
        if (!progress) {
            return null;
        }
        
        if (progress.completed) {
            setTimeout(() => {
                this.modelInstallProgress.delete(modelName);
            }, 5 * 60 * 1000);
        }
        
        return progress;
    }

    async cancelModelInstallation(modelName: string): Promise<boolean> {
        try {
            // Check if installation is in progress
            const progress = this.modelInstallProgress.get(modelName);
            
            if (!progress || progress.completed) {
                return false; // Nothing to cancel
            }
            
            // Markiere den Download als abgebrochen
            console.log(`Cancelling download for model ${modelName}...`);
            this.downloadCancellationFlags.set(modelName, true);
            
            // Warte kurz und überprüfe, ob der Download wirklich abgebrochen wurde
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mark the installation as cancelled
            this.modelInstallProgress.set(modelName, {
                status: 'cancelled',
                completed: true
            });
            
            // Clean up active download
            this.activeDownloads.delete(modelName);
            this.downloadCancellationFlags.delete(modelName);
            
            return true;
        } catch (error) {
            console.error(`Error cancelling installation of model ${modelName}:`, error);
            return false;
        }
    }

    async analyzeSensorData(
        request: SensorDataAnalysisRequest, 
        progressCallback?: ProgressCallback
    ): Promise<AnalysisResponse> {
        try {
            const availableSensorTypes = this.getAvailableSensorTypes(request.sensorData);
            const model = request.model || this.DEFAULT_MODEL;
            
            if (progressCallback) {
                await progressCallback('data_preparation', 'Daten werden aufbereitet', 0.1);
            }
            
            if (progressCallback) {
                await progressCallback('sensor_analysis_start', 'Analyse der Sensordaten beginnt', 0.2);
            }
            
            let completedSensors = 0;
            const sensorAnalysesPromises = availableSensorTypes.map(async (sensorType) => {
                const result = await this.analyzeSingleSensorType(request, sensorType as SensorType, model);
                
                completedSensors++;
                if (progressCallback) {
                    const progress = 0.2 + (completedSensors / availableSensorTypes.length * 0.5);
                    await progressCallback(
                        'sensor_analysis_progress', 
                        `Analyse von ${sensorType} abgeschlossen (${completedSensors}/${availableSensorTypes.length})`,
                        progress
                    );
                }
                
                return result;
            });
            
            const sensorAnalyses = await Promise.all(sensorAnalysesPromises);

            if (progressCallback) {
                await progressCallback('correlation_analysis', 'Zusammenhangsanalyse läuft', 0.7);
            }
            
            const correlations = await this.analyzeCorrelations(request.sensorData, availableSensorTypes, model);

            if (progressCallback) {
                await progressCallback('summary_generation', 'Zusammenfassung wird erstellt', 0.9);
            }

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
            
            if (progressCallback) {
                await progressCallback('analysis_complete', 'Analyse abgeschlossen', 1.0);
            }

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