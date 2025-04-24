import { Request, Response } from 'express';
import { OllamaService, OllamaInstance } from '../services/OllamaService';
import { SensorDataAnalysisRequest } from '../types/ollama.types';

export class OllamaController {
    private ollamaService: OllamaService;

    constructor() {
        this.ollamaService = new OllamaService();
    }

    // Hilfsmethode, um die Benutzer-ID aus dem Request zu extrahieren
    private getUserId(req: Request): string | undefined {
        if (req.user && (req.user as any).id) {
            return (req.user as any).id;
        }
        return undefined;
    }
    
    /**
     * Prüft den Status der Ollama-Verbindung
     */
    checkStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const instanceId = req.query.instanceId as string | undefined;
            const status = await this.ollamaService.checkStatus(instanceId);
            res.status(200).json(status);
        } catch (error) {
            console.error('Fehler bei der Statusprüfung des Ollama-Dienstes:', error);
            res.status(500).json({ 
                status: 'disconnected', 
                message: 'Ein Fehler ist bei der Statusprüfung aufgetreten'
            });
        }
    }

    /**
     * Ruft verfügbare Ollama-Modelle ab
     */
    getAvailableModels = async (req: Request, res: Response): Promise<void> => {
        try {
            const instanceId = req.query.instanceId as string | undefined;
            const models = await this.ollamaService.getAvailableModels(instanceId);
            res.status(200).json({ models });
        } catch (error) {
            console.error('Fehler beim Abrufen der verfügbaren Modelle:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der verfügbaren Modelle' });
        }
    }

    /**
     * Ruft Details eines spezifischen Modells ab
     */
    getModelDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            const { modelName } = req.params;
            const instanceId = req.query.instanceId as string | undefined;
            
            if (!modelName) {
                res.status(400).json({ error: 'Modellname ist erforderlich' });
                return;
            }

            const modelDetails = await this.ollamaService.getModelDetails(modelName, instanceId);
            
            if (!modelDetails) {
                res.status(404).json({ error: `Modell ${modelName} nicht gefunden` });
                return;
            }
            
            res.status(200).json(modelDetails);
        } catch (error) {
            console.error('Fehler beim Abrufen der Modelldetails:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Modelldetails' });
        }
    }

    /**
     * Installiert ein neues Modell
     */
    installModel = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, modelfile, insecure } = req.body;
            const instanceId = req.query.instanceId as string | undefined;
            
            if (!name) {
                res.status(400).json({ error: 'Modellname ist erforderlich' });
                return;
            }
            
            const success = await this.ollamaService.installModel({ 
                name, 
                modelfile, 
                insecure: !!insecure 
            }, instanceId);
            
            if (success) {
                res.status(200).json({ success: true });
            } else {
                res.status(500).json({ 
                    success: false,
                    error: 'Die Installation konnte nicht gestartet werden'
                });
            }
        } catch (error) {
            console.error('Fehler bei der Installation des Modells:', error);
            res.status(500).json({ 
                success: false,
                error: 'Fehler bei der Installation des Modells'
            });
        }
    }

    /**
     * Löscht ein vorhandenes Modell
     */
    deleteModel = async (req: Request, res: Response): Promise<void> => {
        try {
            const { modelName } = req.params;
            const instanceId = req.query.instanceId as string | undefined;
            
            if (!modelName) {
                res.status(400).json({ error: 'Modellname ist erforderlich' });
                return;
            }
            
            const success = await this.ollamaService.deleteModel(modelName, instanceId);
            
            if (success) {
                res.status(200).json({ success: true });
            } else {
                res.status(404).json({ 
                    success: false,
                    error: `Modell ${modelName} konnte nicht gelöscht werden oder wurde nicht gefunden`
                });
            }
        } catch (error) {
            console.error('Fehler beim Löschen des Modells:', error);
            res.status(500).json({ 
                success: false,
                error: 'Fehler beim Löschen des Modells'
            });
        }
    }

    /**
     * Ruft den Installationsfortschritt eines Modells ab
     */
    getModelInstallProgress = async (req: Request, res: Response): Promise<void> => {
        try {
            const { modelName } = req.params;
            
            if (!modelName) {
                res.status(400).json({ error: 'Modellname ist erforderlich' });
                return;
            }
            
            const progressInfo = await this.ollamaService.getModelInstallProgress(modelName);
            
            if (!progressInfo) {
                res.status(404).json({ 
                    error: `Keine laufende Installation für das Modell ${modelName} gefunden`
                });
                return;
            }
            
            res.status(200).json(progressInfo);
        } catch (error) {
            console.error('Fehler beim Abrufen des Installationsstatus:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen des Installationsstatus' });
        }
    }
    
    /**
     * Bricht die Installation eines Modells ab
     */
    cancelModelInstallation = async (req: Request, res: Response): Promise<void> => {
        try {
            const { modelName } = req.params;
            
            if (!modelName) {
                res.status(400).json({ error: 'Modellname ist erforderlich' });
                return;
            }
            
            const success = await this.ollamaService.cancelModelInstallation(modelName);
            
            if (success) {
                res.status(200).json({ success: true });
            } else {
                res.status(404).json({ 
                    success: false,
                    error: `Keine laufende Installation für das Modell ${modelName} gefunden oder die Installation kann nicht abgebrochen werden`
                });
            }
        } catch (error) {
            console.error('Fehler beim Abbrechen der Installation:', error);
            res.status(500).json({ 
                success: false,
                error: 'Fehler beim Abbrechen der Modell-Installation'
            });
        }
    }

    /**
     * Analysiert Sensordaten mit einem KI-Modell
     */
    analyzeSensorData = async (req: Request, res: Response): Promise<void> => {
        try {
            const analysisRequest = req.body as SensorDataAnalysisRequest;
            const userId = this.getUserId(req);
            
            // Validiere die Eingabedaten
            if (!this.validateAnalysisRequest(analysisRequest)) {
                res.status(400).json({ error: 'Ungültige Eingabedaten' });
                return;
            }

            const analysis = await this.ollamaService.analyzeSensorData(
                analysisRequest,
                undefined, // progressCallback
                userId
            );
            res.status(200).json(analysis);
        } catch (error) {
            console.error('Fehler bei der Sensoranalyse:', error);
            res.status(500).json({ error: 'Interner Serverfehler bei der Analyse' });
        }
    }

    /**
     * Gibt die Ollama-Instanzen eines Benutzers zurück
     */
    getUserInstances = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = this.getUserId(req);
            
            if (!userId) {
                res.status(401).json({ error: 'Nicht authentifiziert' });
                return;
            }
            
            const instances = this.ollamaService.getOllamaInstancesForUser(userId);
            res.status(200).json({ instances });
        } catch (error) {
            console.error('Fehler beim Abrufen der Ollama-Instanzen:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Ollama-Instanzen' });
        }
    }

    /**
     * Initialisiert eine WebSocket-Verbindung für die Ollama-Instanzverwaltung
     */
    initWebSocketConnection = async (req: Request, res: Response): Promise<void> => {
        try {
            // Hier könnten in Zukunft ggf. Verbindungsvorbereitungen stattfinden
            // z.B. WebSocket-Token erstellen, Session vorbereiten, etc.
            
            // Aktuell ist dieser Endpunkt hauptsächlich ein Signal für den Client,
            // dass der Server bereit für WebSocket-Verbindungen ist
            const userId = this.getUserId(req);
            
            res.status(200).json({ 
                success: true,
                message: 'WebSocket-Verbindung kann initiiert werden',
                wsEndpoint: '/ws/ollama',
                userId
            });
        } catch (error) {
            console.error('Fehler bei der WebSocket-Initialisierung:', error);
            res.status(500).json({ 
                success: false,
                error: 'Fehler bei der WebSocket-Initialisierung'
            });
        }
    }

    /**
     * Validiert eine Analyseanfrage
     */
    private validateAnalysisRequest(request: SensorDataAnalysisRequest): boolean {
        if (!request.sensorData || !Array.isArray(request.sensorData) || request.sensorData.length === 0) {
            return false;
        }

        if (!request.timeRange || !request.timeRange.start || !request.timeRange.end) {
            return false;
        }

        if (!request.analysisType || !['trend', 'anomaly', 'forecast'].includes(request.analysisType)) {
            return false;
        }

        return true;
    }
}