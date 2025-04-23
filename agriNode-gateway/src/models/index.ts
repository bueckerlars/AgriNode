import { Sequelize } from 'sequelize';

import initUserModel from './User.model';
import initSensorModel from './Sensor.model';
import initSensorDataModel from './SensorData.model';
import initApiKeyModel from './ApiKey.model';
import initSensorSharingModel from './SensorSharing.model';
import initFirmwareModel from './Firmware.model';
import initSensorAnalyticsModel from './SensorAnalytics.model';
import logger from '../config/logger';

// Function to initialize all models
export const initModels = (sequelize: Sequelize) => {
  // Initialize models
  const User = initUserModel(sequelize);
  const Sensor = initSensorModel(sequelize);
  const SensorData = initSensorDataModel(sequelize);
  const ApiKey = initApiKeyModel(sequelize);
  const SensorSharing = initSensorSharingModel(sequelize);
  const Firmware = initFirmwareModel(sequelize);
  const SensorAnalytics = initSensorAnalyticsModel(sequelize);

  // Set up associations
  if (typeof User.associate === 'function') User.associate({ Sensor, SensorSharing, SensorAnalytics });
  if (typeof Sensor.associate === 'function') Sensor.associate({ User, SensorData, SensorSharing, SensorAnalytics });
  if (typeof SensorData.associate === 'function') SensorData.associate({ Sensor });
  if (typeof ApiKey.associate === 'function') ApiKey.associate({ User });
  if (typeof SensorSharing.associate === 'function') SensorSharing.associate({ User, Sensor });
  if (typeof Firmware.associate === 'function') Firmware.associate({});
  if (typeof SensorAnalytics.associate === 'function') SensorAnalytics.associate({ User, Sensor });

  logger.info('Models initialized');
  return {
    User,
    Sensor,
    SensorData,
    ApiKey,
    SensorSharing,
    Firmware,
    SensorAnalytics,
  };
};

export {
  initUserModel,
  initSensorModel,
  initSensorDataModel,
  initApiKeyModel,
  initSensorSharingModel,
  initFirmwareModel,
  initSensorAnalyticsModel,
};

export default initModels;

