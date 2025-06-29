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
 *         model:
 *           type: string
 *           description: Das zu verwendende KI-Modell (optional)
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
 *     ModelDetails:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name des Modells
 *         modelfile:
 *           type: string
 *           description: Modelfile-Inhalt (falls vorhanden)
 *         parameters:
 *           type: number
 *           description: Anzahl der Parameter des Modells
 *         quantization:
 *           type: string
 *           description: Quantisierungsmethode des Modells
 *         size:
 *           type: number
 *           description: Größe des Modells in Bytes
 *         format:
 *           type: string
 *           description: Format des Modells
 *         parameter_size:
 *           type: string
 *           description: Menschenlesbare Parametergröße
 *         families:
 *           type: array
 *           items:
 *             type: string
 *           description: Modellfamilien
 *
 *     ModelInstallParams:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name des zu installierenden Modells
 *         modelfile:
 *           type: string
 *           description: Optionaler Modelfile-Inhalt für angepasste Modelle
 *         insecure:
 *           type: boolean
 *           description: Ignorieren von SSL-Zertifikaten beim Download
 *
 *     InstallProgressResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Aktueller Status der Installation
 *         completed:
 *           type: boolean
 *           description: True wenn die Installation abgeschlossen ist
 *         digest:
 *           type: string
 *           description: Modell-Digest
 *         total:
 *           type: number
 *           description: Gesamtgröße in Bytes
 *         completed_size:
 *           type: number
 *           description: Bereits heruntergeladene Größe in Bytes
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
 * 
 * /api/ollama/models:
 *   get:
 *     tags:
 *       - Ollama
 *     summary: Liste der verfügbaren Modelle
 *     description: Ruft eine Liste aller verfügbaren KI-Modelle ab
 *     responses:
 *       200:
 *         description: Erfolgreicher Abruf der verfügbaren Modelle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Name des Modells
 *                       description:
 *                         type: string
 *                         description: Beschreibung des Modells
 *       500:
 *         description: Serverfehler beim Abrufen der Modelle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 * /api/ollama/models/{modelName}:
 *   get:
 *     tags:
 *       - Ollama
 *     summary: Modellinformationen abrufen
 *     description: Ruft detaillierte Informationen zu einem bestimmten Modell ab
 *     parameters:
 *       - in: path
 *         name: modelName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name des Modells
 *     responses:
 *       200:
 *         description: Erfolgreicher Abruf der Modellinformationen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelDetails'
 *       404:
 *         description: Modell nicht gefunden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Serverfehler beim Abrufen der Modellinformationen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 *   delete:
 *     tags:
 *       - Ollama
 *     summary: Modell löschen
 *     description: Löscht ein vorhandenes Modell
 *     parameters:
 *       - in: path
 *         name: modelName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name des zu löschenden Modells
 *     responses:
 *       200:
 *         description: Modell erfolgreich gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: True, wenn das Modell erfolgreich gelöscht wurde
 *       404:
 *         description: Modell nicht gefunden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Serverfehler beim Löschen des Modells
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 * /api/ollama/models:
 *   post:
 *     tags:
 *       - Ollama
 *     summary: Modell installieren
 *     description: Installiert ein neues Modell
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModelInstallParams'
 *     responses:
 *       200:
 *         description: Installation erfolgreich gestartet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: True, wenn die Installation erfolgreich gestartet wurde
 *       400:
 *         description: Ungültige Anfrage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Serverfehler bei der Installation des Modells
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 * /api/ollama/models/{modelName}/progress:
 *   get:
 *     tags:
 *       - Ollama
 *     summary: Installationsstatus abrufen
 *     description: Ruft den aktuellen Status der Modellinstallation ab
 *     parameters:
 *       - in: path
 *         name: modelName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name des Modells, dessen Installationsstatus abgerufen werden soll
 *     responses:
 *       200:
 *         description: Erfolgreicher Abruf des Installationsstatus
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InstallProgressResponse'
 *       404:
 *         description: Keine laufende Installation für dieses Modell gefunden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Serverfehler beim Abrufen des Installationsstatus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 *   delete:
 *     tags:
 *       - Ollama
 *     summary: Installation abbrechen
 *     description: Bricht die laufende Installation eines Modells ab
 *     parameters:
 *       - in: path
 *         name: modelName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name des Modells, dessen Installation abgebrochen werden soll
 *     responses:
 *       200:
 *         description: Installation erfolgreich abgebrochen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: True, wenn die Installation erfolgreich abgebrochen wurde
 *       404:
 *         description: Keine laufende Installation für dieses Modell gefunden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Serverfehler beim Abbrechen der Installation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/analyze-sensor-data', ollamaController.analyzeSensorData);
router.get('/status', ollamaController.checkStatus);
router.get('/models', ollamaController.getAvailableModels);
router.get('/models/:modelName', ollamaController.getModelDetails);
router.post('/models', ollamaController.installModel);
router.delete('/models/:modelName', ollamaController.deleteModel);
router.get('/models/:modelName/progress', ollamaController.getModelInstallProgress);
router.delete('/models/:modelName/progress', ollamaController.cancelModelInstallation);

export default router;