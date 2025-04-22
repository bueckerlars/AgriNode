import { Request, Response } from 'express';
import { OllamaService } from '../services/OllamaService';
import { SensorDataAnalysisRequest } from '../types/ollama.types';

export class OllamaController {
    private ollamaService: OllamaService;

    constructor() {
        this.ollamaService = new OllamaService();
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