import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import logger from './config/logger';
import cors from 'cors';
import swaggerSpec from './config/swagger';
import AuthRoutes from './routes/AuthRoutes';
import sensorRoutes from './routes/SensorRoutes';
import SensorDataRoutes from './routes/SensorDataRoutes';
import cookieParser from 'cookie-parser';
import apiKeyRoutes from './routes/ApiKeyRoutes';
import userRoutes from './routes/UserRoutes';
import sensorSharingRoutes from './routes/SensorSharingRoutes';
import firmwareRoutes from './routes/FirmwareRoutes';
import ollamaRoutes from './routes/OllamaRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

app.use(cors({
  origin: process.env.DASHBOARD_URL || "*", // Allow the dashboard URL or all origins
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}));

app.use("/api/auth/" , AuthRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/sensor-data', SensorDataRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sharing', sensorSharingRoutes);
app.use('/api/firmware', firmwareRoutes);
app.use('/api/ollama', ollamaRoutes);

// Swagger route

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Get the status of the API
 *     description: Returns the status of the API to indicate it is running.
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
*/
app.get('/status', (req: Request, res: Response) => {
  logger.info('Status route accessed');
  res.json({ status: 'ok' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});