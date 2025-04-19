import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { SensorSharing as SensorSharingType, SharingStatus } from '../types/SensorSharing';
import { v4 as uuidv4 } from 'uuid';

interface SensorSharingCreationAttributes extends Optional<SensorSharingType, 'sharing_id'> {}

class SensorSharing extends Model<SensorSharingType, SensorSharingCreationAttributes> implements SensorSharingType {
  public sharing_id!: string;
  public sensor_id!: string;
  public owner_id!: string;
  public shared_with_id!: string;
  public status!: SharingStatus;
  public created_at!: Date;
  public updated_at!: Date;

  static associate(models: any) {
    SensorSharing.belongsTo(models.Sensor, { foreignKey: 'sensor_id' });
    SensorSharing.belongsTo(models.User, { foreignKey: 'owner_id', as: 'owner' });
    SensorSharing.belongsTo(models.User, { foreignKey: 'shared_with_id', as: 'sharedWith' });
  }
}

export default (sequelize: Sequelize) => {
  SensorSharing.init(
    {
      sharing_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      sensor_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Sensors',
          key: 'sensor_id',
        },
      },
      owner_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id',
        },
      },
      shared_with_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id',
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      created_at: {
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
      modelName: 'SensorSharing',
      tableName: 'SensorSharings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return SensorSharing;
};