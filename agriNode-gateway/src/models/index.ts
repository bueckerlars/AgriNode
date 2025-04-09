import { Sequelize } from 'sequelize';

import initUserModel from './User.model';
import initSensorModel from './Sensor.model';
import initSensorDataModel from './SensorData.model';
import logger from '../config/logger';

// Function to initialize all models
export const initModels = (sequelize: Sequelize) => {
  // Initialize models
  const User = initUserModel(sequelize);
  const Sensor = initSensorModel(sequelize);
  const SensorData = initSensorDataModel(sequelize);

  // Set up associations
  if (typeof User.associate === 'function') User.associate({ Sensor });
  if (typeof Sensor.associate === 'function') Sensor.associate({ User, SensorData });
  if (typeof SensorData.associate === 'function') SensorData.associate({ Sensor });

  logger.info('Models initialized');
  return {
    User,
    Sensor,
    SensorData,
  };
};

export {
  initUserModel,
  initSensorModel,
  initSensorDataModel,
};

export default initModels;