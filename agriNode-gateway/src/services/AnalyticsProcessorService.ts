import { OllamaService, ProgressCallback } from './OllamaService';
import { SensorDataAnalysisRequest, AnalysisResponse, SensorDataPoint } from '../types/ollama.types';
import databaseController from '../controller/DatabaseController';
import logger from '../config/logger';
import { AnalysisStatus, AnalysisType, ProgressInfo, ProgressStep } from '../types/SensorAnalytics';
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
     * Initialisiert die Fortschrittsschritte für eine Analyse
     */
    private initializeProgressSteps(analyticsId: string, type: AnalysisType): Promise<void> {
        // Definiere die Fortschrittsschritte basierend auf dem Analysetyp
        const steps: ProgressStep[] = [];
        
        // Gemeinsame Schritte für alle Analysetypen
        steps.push(
            { index: 0, description: "Datenvorbereitung", status: "pending" },
            { index: 1, description: "Datenvalidierung", status: "pending" },
            { index: 2, description: "Datenanalyse", status: "pending" }
        );
        
        // Spezifische Schritte je nach Analysetyp
        if (type === AnalysisType.TREND) {
            steps.push(
                { index: 3, description: "Trenderkennung", status: "pending" },
                { index: 4, description: "Trendanalyse abschließen", status: "pending" }
            );
        } else if (type === AnalysisType.ANOMALY) {
            steps.push(
                { index: 3, description: "Anomalieerkennung", status: "pending" },
                { index: 4, description: "Anomalieanalyse abschließen", status: "pending" }
            );
        } else if (type === AnalysisType.FORECAST) {
            steps.push(
                { index: 3, description: "Modelltraining", status: "pending" },
                { index: 4, description: "Vorhersageberechnung", status: "pending" },
                { index: 5, description: "Vorhersageanalyse abschließen", status: "pending" }
            );
        }
        
        const progressInfo: ProgressInfo = {
            totalSteps: steps.length,
            currentStep: 0,
            steps: steps
        };
        
        return this.updateAnalyticsProgress(analyticsId, progressInfo);
    }
    
    /**
     * Aktualisiert den Fortschritt einer Analyse
     */
    private async updateAnalyticsProgress(analyticsId: string, progress: ProgressInfo): Promise<void> {
        try {
            await databaseController.updateSensorAnalytics({
                progress,
                updated_at: new Date()
            }, { analytics_id: analyticsId });
        } catch (error) {
            logger.error(`Error updating analytics progress: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    /**
     * Aktualisiert den aktuellen Fortschrittsschritt
     * @param analyticsId Die ID der Analyse
     * @param stepIndex Der Index des zu aktualisierenden Schritts
     * @param status Der neue Status des Schritts
     * @param updateProgress Ob die Fortschrittsanzeige aktualisiert werden soll (Standard: true)
     */
    private async updateProgressStep(
        analyticsId: string, 
        stepIndex: number, 
        status: 'pending' | 'active' | 'completed' | 'failed',
        updateProgress: boolean = true
    ): Promise<void> {
        try {
            const analytics = await databaseController.findSensorAnalyticsById(analyticsId);
            if (!analytics || !analytics.progress) {
                logger.error(`Cannot update progress step: Analytics ${analyticsId} not found or no progress data`);
                return;
            }
            
            const progress = { ...analytics.progress };
            
            if (stepIndex >= 0 && stepIndex < progress.steps.length) {
                const currentTime = new Date();
                
                // Aktualisiere den Status des angegebenen Schritts
                progress.steps[stepIndex].status = status;
                
                // Erfasse Start- und Endzeit sowie Dauer
                if (status === 'active') {
                    // Startzeit setzen, wenn Schritt aktiviert wird
                    progress.steps[stepIndex].startTime = currentTime;
                    // Endzeit und Dauer zurücksetzen, falls der Schritt erneut aktiviert wird
                    progress.steps[stepIndex].endTime = undefined;
                    progress.steps[stepIndex].duration = undefined;
                } else if (status === 'completed' || status === 'failed') {
                    // Endzeit setzen und Dauer berechnen, wenn Schritt abgeschlossen oder fehlgeschlagen ist
                    progress.steps[stepIndex].endTime = currentTime;
                    
                    // Nur Dauer berechnen, wenn auch eine Startzeit existiert
                    if (progress.steps[stepIndex].startTime) {
                        const startTime = new Date(progress.steps[stepIndex].startTime!);
                        progress.steps[stepIndex].duration = currentTime.getTime() - startTime.getTime();
                    }
                }
                
                // Aktualisiere den aktuellen Schritt nur wenn explizit gewünscht
                // und wenn die Fortschrittsanzeige aktualisiert werden soll
                if (updateProgress) {
                    // Setze den aktuellen Schritt nur, wenn ein Schritt abgeschlossen wird (nicht beim Aktivieren)
                    if (status === 'completed') {
                        // Finde den nächsten ausstehenden Schritt
                        const nextPendingIndex = progress.steps.findIndex(
                            (step, index) => index > stepIndex && step.status === 'pending'
                        );
                        
                        if (nextPendingIndex !== -1) {
                            progress.currentStep = nextPendingIndex;
                        }
                    } 
                    // Wenn ein Schritt aktiv wird, setze ihn nur als aktuell, wenn er größer als der aktuelle ist
                    else if (status === 'active' && stepIndex > progress.currentStep) {
                        progress.currentStep = stepIndex;
                    }
                }
                
                await this.updateAnalyticsProgress(analyticsId, progress);
            }
        } catch (error) {
            logger.error(`Error updating progress step: ${error instanceof Error ? error.message : String(error)}`);
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
            
            // Initialisiere die Fortschrittsschritte für diese Analyse
            await this.initializeProgressSteps(analyticsId, analytics.type);

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
            
            // Schritt 0: Datenvorbereitung beginnt
            await this.updateProgressStep(analyticsId, 0, 'active', false);

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
                
                // Schritt 0: Datenvorbereitung abgeschlossen und Schritt 1 beginnt erst danach
                await this.updateProgressStep(analyticsId, 0, 'completed', true);
                
                // Schritt 1: Datenvalidierung beginnt - erst nach Abschluss des vorherigen Schritts
                await this.updateProgressStep(analyticsId, 1, 'active', false);

                if (sensorData.length === 0) {
                    logger.error(`No sensor data found for analytics ${analyticsId}`);
                    // Markiere den aktuellen Schritt als fehlgeschlagen
                    await this.updateProgressStep(analyticsId, 1, 'failed', true);
                    await this.updateAnalyticsStatus(analyticsId, AnalysisStatus.FAILED);
                    this.isProcessing = false;
                    this.processNextInQueue();
                    return;
                }

                logger.debug(`Found ${sensorData.length} data points for sensor ${sensor_id}`);
                
                // Schritt 1: Datenvalidierung abgeschlossen
                await this.updateProgressStep(analyticsId, 1, 'completed', true);

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

                // Schritt 2: Datenanalyse beginnt - Aktivieren, aber Fortschritt noch nicht erhöhen
                await this.updateProgressStep(analyticsId, 2, 'active', false);
                
                // Erstelle einen Fortschritts-Callback für OllamaService
                const progressCallback: ProgressCallback = async (phase, detail, progress) => {
                    logger.debug(`Analysis progress: ${phase} - ${detail} (${Math.round(progress * 100)}%)`);
                    
                    // Mapping von OllamaService-Phasen zu unseren Progress-Schritten
                    const phaseToStepMap: Record<string, number | null> = {
                        'data_preparation': 0, // Datenaufbereitung
                        'sensor_analysis_start': 2, // Datenanalyse beginnt
                        'sensor_analysis_progress': 2, // Datenanalyse läuft
                        'correlation_analysis': 3, // Spezifischer Schritt je nach Analysetyp
                        'summary_generation': 4, // Vorletzter Schritt
                        'analysis_complete': null // Spezieller Fall - Abschluss
                    };
                    
                    // Bei dieser Phase aktualisieren wir immer komplett den letzten Schritt
                    if (phase === 'analysis_complete') {
                        // Datenanalyse abschließen
                        await this.updateProgressStep(analyticsId, 2, 'completed', true);
                        
                        // Schrittweise die typspezifischen Schritte abschließen
                        const analyticsCurrent = await databaseController.findSensorAnalyticsById(analyticsId);
                        if (analyticsCurrent?.progress) {
                            for (let i = 3; i < analyticsCurrent.progress.steps.length; i++) {
                                // Schritt kurz aktivieren und dann abschließen
                                await this.updateProgressStep(analyticsId, i, 'active', i < analyticsCurrent.progress.steps.length - 1);
                                await new Promise(resolve => setTimeout(resolve, 300)); // Kurze Verzögerung für UI-Feedback
                                await this.updateProgressStep(analyticsId, i, 'completed', true);
                                await new Promise(resolve => setTimeout(resolve, 300)); // Kurze Verzögerung für UI-Feedback
                            }
                        }
                        return;
                    }
                    
                    const stepIndex = phaseToStepMap[phase];
                    if (stepIndex !== null && stepIndex !== undefined) {
                        // Bei sensor_analysis_progress setzen wir den Status auf completed wenn wir
                        // bei 100% sind oder nahe dran und bleiben sonst bei active
                        if (phase === 'sensor_analysis_progress') {
                            if (progress >= 1.0) {
                                // Bei 100% markieren wir den Schritt als abgeschlossen
                                await this.updateProgressStep(analyticsId, stepIndex, 'completed', true);
                            } else if (progress < 0.7) {
                                // Nur den Status aktiv halten, nicht die Fortschrittsanzeige erhöhen
                                await this.updateProgressStep(analyticsId, stepIndex, 'active', false);
                            }
                        } 
                        // Bei Korrelationsanalyse finden wir den entsprechenden typspezifischen Schritt
                        else if (stepIndex === 3) {
                            let description = '';
                            switch (analytics.type) {
                                case AnalysisType.TREND:
                                    description = phase === 'correlation_analysis' ? 'Trenderkennung' : '';
                                    break;
                                case AnalysisType.ANOMALY:
                                    description = phase === 'correlation_analysis' ? 'Anomalieerkennung' : '';
                                    break;
                                case AnalysisType.FORECAST:
                                    description = phase === 'correlation_analysis' ? 'Modelltraining' : '';
                                    break;
                                default:
                                    break;
                            }
                            
                            if (description) {
                                // Finde den Schritt mit der entsprechenden Beschreibung
                                const analyticsData = await databaseController.findSensorAnalyticsById(analyticsId);
                                if (analyticsData?.progress) {
                                    const stepWithDescription = analyticsData.progress.steps.find(
                                        step => step.description.includes(description)
                                    );
                                    if (stepWithDescription) {
                                        // Aktivieren nur ohne Fortschritt zu erhöhen - erst bei Fertigstellung
                                        // richtig als abgeschlossen markieren
                                        await this.updateProgressStep(
                                            analyticsId, 
                                            stepWithDescription.index, 
                                            'active', 
                                            false  // Fortschritt noch nicht erhöhen
                                        );
                                    }
                                }
                            }
                        } 
                        // Für alle anderen Phasen markieren wir erst active ohne Fortschritt
                        else if (phase === 'summary_generation') {
                            // Erst vorherige Schritte abschließen
                            if (analytics.type === AnalysisType.TREND || analytics.type === AnalysisType.ANOMALY) {
                                await this.updateProgressStep(analyticsId, 3, 'completed', true);
                            } else if (analytics.type === AnalysisType.FORECAST) {
                                await this.updateProgressStep(analyticsId, 3, 'completed', true);
                                await this.updateProgressStep(analyticsId, 4, 'active', true);
                            }
                        }
                    }
                };
                
                // Führe die Analyse mit OllamaAPI durch und übergebe den Callback
                const analysisResponse = await this.ollamaService.analyzeSensorData(analysisRequest, progressCallback);
                
                // Speichere das Ergebnis in der Datenbank
                await databaseController.updateSensorAnalytics({
                    status: AnalysisStatus.COMPLETED,
                    result: analysisResponse,
                    updated_at: new Date()
                }, { analytics_id: analyticsId });

                logger.info(`Successfully processed analytics ${analyticsId}`);
            } catch (error) {
                logger.error(`Error processing sensor data: ${error instanceof Error ? error.message : String(error)}`);
                // Markiere den aktuellen Schritt als fehlgeschlagen
                const analytics = await databaseController.findSensorAnalyticsById(analyticsId);
                if (analytics?.progress?.currentStep !== undefined) {
                    await this.updateProgressStep(analyticsId, analytics.progress.currentStep, 'failed', true);
                }
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