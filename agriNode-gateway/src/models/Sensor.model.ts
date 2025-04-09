import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { Sensor as SensorType } from '../types/Sensor';

interface SensorCreationAttributes extends Optional<SensorType, 'sensor_id'> {}

class Sensor extends Model<SensorType, SensorCreationAttributes> implements SensorType {
  public sensor_id!: string;
  public user_id!: string;
  public name!: string;
  public description?: string;
  public unique_device_id!: string;
  public registered_at!: Date;
  public updated_at!: Date;

  static associate(models: any) {
    Sensor.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}

export default (sequelize: Sequelize) => {
  Sensor.init(
    {
      sensor_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unique_device_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      registered_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Sensor',
      tableName: 'Sensors',
      timestamps: true,
      createdAt: 'registered_at',
      updatedAt: 'updated_at',
    }
  );

  return Sensor;
};