import { Router } from 'express';
import { OllamaController } from '../controller/OllamaController';

const router = Router();
const ollamaController = new OllamaController();

/**
 * @swagger
 * components:
 *   schemas:
 *     SensorDataPoint:
 *       type: object
 *       required:
 *         - timestamp
 *         - measurements
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Der Zeitstempel der Messung
 *         measurements:
 *           type: object
 *           properties:
 *             temperature:
 *               type: number
 *               description: Temperaturmessung in °C
 *             humidity:
 *               type: number
 *               description: Luftfeuchtigkeit in %
 *             brightness:
 *               type: number
 *               description: Helligkeit in Lux
 *             soilMoisture:
 *               type: number
 *               description: Bodenfeuchtigkeit in %
 * 
 *     TimeRange:
 *       type: object
 *       required:
 *         - start
 *         - end
 *       properties:
 *         start:
 *           type: string
 *           format: date-time
 *           description: Startzeitpunkt der Analyse
 *         end:
 *           type: string
 *           format: date-time
 *           description: Endzeitpunkt der Analyse
 * 
 *     SensorDataAnalysisRequest:
 *       type: object
 *       required:
 *         - sensorData
 *         - timeRange
 *         - analysisType
 *       properties:
 *         sensorData:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SensorDataPoint'
 *           description: Array von Sensormessungen mit verschiedenen Messwerten
 *         timeRange:
 *           $ref: '#/components/schemas/TimeRange'
 *         analysisType:
 *           type: string
 *           enum: [trend, anomaly, forecast]
 *           description: Art der gewünschten Analyse
 * 
 *     SensorTypeAnalysis:
 *       type: object
 *       properties:
 *         sensorType:
 *           type: string
 *           enum: [temperature, humidity, brightness, soilMoisture]
 *           description: Typ des analysierten Sensors
 *         summary:
 *           type: string
 *           description: Zusammenfassende Analyse der Daten
 *         trends:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Art des erkannten Trends
 *               description:
 *                 type: string
 *                 description: Detaillierte Beschreibung des Trends
 *               confidence:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Konfidenz der Trendanalyse
 *         anomalies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Zeitpunkt der Anomalie
 *               description:
 *                 type: string
 *                 description: Beschreibung der Anomalie
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Schweregrad der Anomalie
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste von Handlungsempfehlungen
 * 
 *     AnalysisResponse:
 *       type: object
 *       properties:
 *         overallSummary:
 *           type: string
 *           description: Gesamtzusammenfassung aller Analysen
 *         sensorAnalyses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SensorTypeAnalysis'
 *           description: Einzelanalysen für jeden Sensortyp
 *         correlations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Beschreibung des Zusammenhangs
 *               sensorTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Beteiligte Sensortypen
 *               confidence:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Konfidenz der Korrelation
 *           description: Erkannte Zusammenhänge zwischen verschiedenen Sensordaten
 *         metadata:
 *           type: object
 *           properties:
 *             modelUsed:
 *               type: string
 *               description: Verwendetes KI-Modell
 *             analysisTimestamp:
 *               type: string
 *               format: date-time
 *               description: Zeitpunkt der Analyse
 *             dataPointsAnalyzed:
 *               type: integer
 *               description: Anzahl der analysierten Datenpunkte
 * 
 * /api/ollama/analyze-sensor-data:
 *   post:
 *     tags:
 *       - Ollama
 *     summary: Analysiert multiple Sensordaten mit KI
 *     description: Führt eine KI-gestützte Analyse verschiedener Sensordaten durch, erkennt Trends, Anomalien und Korrelationen zwischen den Messgrößen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SensorDataAnalysisRequest'
 *     responses:
 *       200:
 *         description: Erfolgreiche Analyse
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisResponse'
 *       400:
 *         description: Ungültige Eingabedaten
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Serverfehler bei der Analyse
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 * 
 * /api/ollama/status:
 *   get:
 *     tags:
 *       - Ollama
 *     summary: Prüft den Status der Ollama-Verbindung
 *     description: Überprüft, ob eine Verbindung zum Ollama-Dienst hergestellt werden kann
 *     responses:
 *       200:
 *         description: Erfolgreiche Statusprüfung
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                   description: Status der Verbindung zum Ollama-Dienst
 *                 message:
 *                   type: string
 *                   description: Detaillierte Statusnachricht
 *       500:
 *         description: Serverfehler bei der Statusprüfung
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/analyze-sensor-data', ollamaController.analyzeSensorData);
router.get('/status', ollamaController.checkStatus);

export default router;