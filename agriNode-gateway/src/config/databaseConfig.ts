import { DatabaseConfig } from '../types';
import { Dialect } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const databaseConfig: DatabaseConfig = {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'agri_db',
    host: process.env.DB_HOST || 'db', // Ensure IPv4 is used
    dialect: (process.env.DB_DIALECT as Dialect) || 'postgres',
};

export default databaseConfig;