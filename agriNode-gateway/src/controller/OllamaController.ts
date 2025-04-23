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