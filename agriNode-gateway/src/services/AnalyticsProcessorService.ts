import { OllamaService } from './OllamaService';
import { SensorDataAnalysisRequest, AnalysisResponse, SensorDataPoint } from '../types/ollama.types';
import databaseController from '../controller/DatabaseController';
import logger from '../config/logger';
import { AnalysisStatus, AnalysisType } from '../types/SensorAnalytics';
import { Op } from 'sequelize';  // Importiere Sequelize-Operatoren

/**
 * Der AnalyticsProcessorService verarbeitet Sensoranalysen in der Warteschlange
 * und sorgt dafür, dass immer nur eine Analyse zur Zeit läuft
 */
export class AnalyticsProcessorService {
    private ollamaService: OllamaService;
    private isProcessing: boolean = false;
    private processingQueue: string[] = [];

    constructor() {
        this.ollamaService = new OllamaService();
    }

    /**
     * Fügt eine neue Analyse-ID zur Verarbeitungswarteschlange hinzu
     * und startet die Verarbeitung, wenn aktuell keine läuft
     */
    public queueAnalyticsForProcessing(analyticsId: string): void {
        logger.info(`Queueing analytics ID ${analyticsId} for processing`);
        
        // Zur Queue hinzufügen, wenn nicht bereits vorhanden
        if (!this.processingQueue.includes(analyticsId)) {
            this.processingQueue.push(analyticsId);
            logger.debug(`Added analytics ID ${analyticsId} to queue. Queue length: ${this.processingQueue.length}`);
        }

        // Starte Verarbeitung, wenn nicht bereits aktiv
        if (!this.isProcessing) {
            this.processNextInQueue();
        }
    }

    /**
     * Verarbeitet die nächste Analyse in der Warteschlange
     */
    private async processNextInQueue(): Promise<void> {
        if (this.processingQueue.length === 0) {
            logger.debug('No analytics in queue, nothing to process');
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const analyticsId = this.processingQueue.shift();

        if (!analyticsId) {
            this.isProcessing = false;
            return;
        }

        logger.info(`Processing analytics ID ${analyticsId}`);

        try {
            // Setze den Status auf "processing"
            await this.updateAnalyticsStatus(analyticsId, AnalysisStatus.PROCESSING);
            
            // Hole die Analyse-Daten
            const analytics = await databaseController.findSensorAnalyticsById(analyticsId);
            if (!analytics) {
                logger.error(`Analytics with ID ${analyticsId} not found`);
                this.isProcessing = false;
                this.processNextInQueue();
                return;
            }

            // Hole die zugehörigen Sensordaten
            const { sensor_id, parameters } = analytics;
            const timeRange = parameters?.timeRange;

            if (!timeRange || !timeRange.start || !timeRange.end) {
                logger.error(`Invalid time range for analytics ${analyticsId}`);
                await this.updateAnalyticsStatus(analyticsId, AnalysisStatus.FAILED);
                this.isProcessing = false;
                this.processNextInQueue();
                return;
            }

            logger.debug(`Fetching sensor data for sensor ${sensor_id} from ${timeRange.start} to ${timeRange.end}`);

            try {
                // Korrekte Verwendung des between-Operators in Sequelize
                const sensorData = await databaseController.findAllSensorData({
                    where: {
                        sensor_id,
                        timestamp: {
                            [Op.between]: [new Date(timeRange.start), new Date(timeRange.end)]
                        }
                    },
                    order: [['timestamp', 'ASC']]
                });

                if (sensorData.length === 0) {
                    logger.error(`No sensor data found for analytics ${analyticsId}`);
                    await this.updateAnalyticsStatus(analyticsId, AnalysisStatus.FAILED);
                    this.isProcessing = false;
                    this.processNextInQueue();
                    return;
                }

                logger.debug(`Found ${sensorData.length} data points for sensor ${sensor_id}`);

                // Konvertiere die Sensordaten in das Format für OllamaAPI
                const formattedSensorData: SensorDataPoint[] = sensorData.map(data => {
                    // Sicherstellen, dass alle Zeitstempel korrekt formatiert sind
                    const timestamp = typeof data.timestamp === 'string' 
                        ? data.timestamp 
                        : data.timestamp instanceof Date 
                            ? data.timestamp.toISOString() 
                            : new Date(data.timestamp).toISOString();
                    
                    return {
                        timestamp,
                        measurements: {
                            temperature: data.air_temperature !== undefined ? Number(data.air_temperature) : undefined,
                            humidity: data.air_humidity !== undefined ? Number(data.air_humidity) : undefined,
                            brightness: data.brightness !== undefined ? Number(data.brightness) : undefined,
                            soilMoisture: data.soil_moisture !== undefined ? Number(data.soil_moisture) : undefined
                        }
                    };
                });

                // Validiere die Analysetype
                let analysisType: 'trend' | 'anomaly' | 'forecast' = 'trend'; // Default-Wert
                const lowerCaseType = analytics.type.toLowerCase();
                if (lowerCaseType === 'trend' || lowerCaseType === 'anomaly' || lowerCaseType === 'forecast') {
                    analysisType = lowerCaseType as 'trend' | 'anomaly' | 'forecast';
                } else {
                    logger.warn(`Invalid analysis type '${analytics.type}', defaulting to 'trend'`);
                }
                
                // Extrahiere das ausgewählte Modell aus den Parametern, falls vorhanden
                const selectedModel = parameters?.model;
                if (selectedModel) {
                    logger.debug(`Using selected model: ${selectedModel}`);
                }

                // Bereite die Analyse-Anfrage vor
                const analysisRequest: SensorDataAnalysisRequest = {
                    sensorData: formattedSensorData,
                    timeRange: {
                        start: timeRange.start,
                        end: timeRange.end
                    },
                    analysisType,
                    model: selectedModel // Füge das ausgewählte Modell hinzu
                };

                logger.debug(`Sending analysis request to OllamaAPI: ${JSON.stringify({
                    type: analysisRequest.analysisType,
                    dataPoints: analysisRequest.sensorData.length,
                    timeRange: analysisRequest.timeRange,
                    model: analysisRequest.model || 'default'
                })}`);

                // Führe die Analyse mit OllamaAPI durch
                const analysisResponse = await this.ollamaService.analyzeSensorData(analysisRequest);
                
                // Speichere das Ergebnis in der Datenbank
                await databaseController.updateSensorAnalytics({
                    status: AnalysisStatus.COMPLETED,
                    result: analysisResponse,
                    updated_at: new Date()
                }, { analytics_id: analyticsId });

                logger.info(`Successfully processed analytics ${analyticsId}`);
            } catch (error) {
                logger.error(`Error processing sensor data: ${error instanceof Error ? error.message : String(error)}`);
                await this.updateAnalyticsStatus(analyticsId, AnalysisStatus.FAILED);
            }
        } catch (error) {
            logger.error(`Error processing analytics ${analyticsId}: ${error instanceof Error ? error.message : String(error)}`);
            await this.updateAnalyticsStatus(analyticsId, AnalysisStatus.FAILED);
        } finally {
            this.isProcessing = false;
            // Verarbeite die nächste Analyse in der Warteschlange
            this.processNextInQueue();
        }
    }

    /**
     * Aktualisiert den Status einer Analyse
     */
    private async updateAnalyticsStatus(analyticsId: string, status: AnalysisStatus): Promise<void> {
        try {
            await databaseController.updateSensorAnalytics({
                status,
                updated_at: new Date()
            }, { analytics_id: analyticsId });
        } catch (error) {
            logger.error(`Error updating analytics status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Prüft auf ausstehende Analysen in der Datenbank und fügt sie zur Queue hinzu
     */
    public async checkForPendingAnalytics(): Promise<void> {
        try {
            const pendingAnalytics = await databaseController.findAllSensorAnalytics({
                where: { status: AnalysisStatus.PENDING }
            });
            
            if (pendingAnalytics.length > 0) {
                logger.info(`Found ${pendingAnalytics.length} pending analytics`);
                
                // Füge jede ausstehende Analyse zur Warteschlange hinzu
                pendingAnalytics.forEach(analytics => {
                    this.queueAnalyticsForProcessing(analytics.analytics_id);
                });
            }
        } catch (error) {
            logger.error(`Error checking for pending analytics: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

// Exportiere eine Singleton-Instanz
const analyticsProcessorService = new AnalyticsProcessorService();
export default analyticsProcessorService;