import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { SensorData as SensorDataType } from '../types/SensorData';
import { v4 as uuidv4 } from 'uuid';

interface SensorDataCreationAttributes extends Optional<SensorDataType, 'data_id'> {}

class SensorData extends Model<SensorDataType, SensorDataCreationAttributes> implements SensorDataType {
  public data_id!: string;
  public sensor_id!: string;
  public timestamp!: Date;
  public air_humidity!: number;
  public air_temperature!: number;
  public soil_moisture!: number;
  public brightness!: number;
  public battery_level!: number;

  static associate(models: any) {
    SensorData.belongsTo(models.Sensor, { foreignKey: 'sensor_id' });
  }
}

export default (sequelize: Sequelize) => {
  SensorData.init(
    {
      data_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(), // Automatically generates a new UUID
      },
      sensor_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Sensors',
          key: 'sensor_id',
        },
        onDelete: 'CASCADE',
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      air_humidity: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      air_temperature: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      soil_moisture: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      brightness: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      battery_level: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SensorData',
      tableName: 'SensorData',
      timestamps: false,
    }
  );

  return SensorData;
};