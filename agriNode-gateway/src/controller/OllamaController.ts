import { Request, Response } from 'express';
import { OllamaService } from '../services/OllamaService';
import { SensorDataAnalysisRequest } from '../types/ollama.types';

export class OllamaController {
    private ollamaService: OllamaService;

    constructor() {
        this.ollamaService = new OllamaService();
    }

    checkStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = await this.ollamaService.checkStatus();
            res.status(200).json(status);
        } catch (error) {
            console.error('Fehler bei der Statusprüfung des Ollama-Dienstes:', error);
            res.status(500).json({ 
                status: 'disconnected', 
                message: 'Ein Fehler ist bei der Statusprüfung aufgetreten'
            });
        }
    }

    getAvailableModels = async (req: Request, res: Response): Promise<void> => {
        try {
            const models = await this.ollamaService.getAvailableModels();
            res.status(200).json({ models });
        } catch (error) {
            console.error('Fehler beim Abrufen der verfügbaren Modelle:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der verfügbaren Modelle' });
        }
    }

    getModelDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            const { modelName } = req.params;
            if (!modelName) {
                res.status(400).json({ error: 'Modellname ist erforderlich' });
                return;
            }

            const modelDetails = await this.ollamaService.getModelDetails(modelName);
            
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

    installModel = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, modelfile, insecure } = req.body;
            
            if (!name) {
                res.status(400).json({ error: 'Modellname ist erforderlich' });
                return;
            }
            
            const success = await this.ollamaService.installModel({ 
                name, 
                modelfile, 
                insecure: !!insecure 
            });
            
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

    deleteModel = async (req: Request, res: Response): Promise<void> => {
        try {
            const { modelName } = req.params;
            
            if (!modelName) {
                res.status(400).json({ error: 'Modellname ist erforderlich' });
                return;
            }
            
            const success = await this.ollamaService.deleteModel(modelName);
            
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

    analyzeSensorData = async (req: Request, res: Response): Promise<void> => {
        try {
            const analysisRequest = req.body as SensorDataAnalysisRequest;
            
            // Validiere die Eingabedaten
            if (!this.validateAnalysisRequest(analysisRequest)) {
                res.status(400).json({ error: 'Ungültige Eingabedaten' });
                return;
            }

            const analysis = await this.ollamaService.analyzeSensorData(analysisRequest);
            res.status(200).json(analysis);
        } catch (error) {
            console.error('Fehler bei der Sensoranalyse:', error);
            res.status(500).json({ error: 'Interner Serverfehler bei der Analyse' });
        }
    }

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