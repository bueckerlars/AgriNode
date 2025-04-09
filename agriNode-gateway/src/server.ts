import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import logger from './config/logger';
import swaggerSpec from './config/swagger';
import AuthRoutes from './routes/AuthRoutes';
import sensorRoutes from './routes/SensorRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use("/api/auth/" , AuthRoutes);
app.use('/api/sensors', sensorRoutes);


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