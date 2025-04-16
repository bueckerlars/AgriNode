import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// Bestimme den richtigen Pfad basierend auf der Umgebung
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? path.join(__dirname, '..') : './src';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgriNode API',
      version: '1.0.0',
      description: 'API documentation for AgriNode',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
  },
  apis: [
    `${basePath}/routes/*.ts`, 
    `${basePath}/routes/*.js`, 
    `${basePath}/server.ts`,
    `${basePath}/server.js`
  ], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;