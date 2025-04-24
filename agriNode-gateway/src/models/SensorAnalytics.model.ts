import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { SensorAnalytics as SensorAnalyticsType, AnalysisStatus, AnalysisType, ProgressInfo } from '../types/SensorAnalytics';
import { v4 as uuidv4 } from 'uuid';

interface SensorAnalyticsCreationAttributes extends Optional<SensorAnalyticsType, 'analytics_id' | 'created_at' | 'updated_at'> {}

class SensorAnalytics extends Model<SensorAnalyticsType, SensorAnalyticsCreationAttributes> implements SensorAnalyticsType {
  public analytics_id!: string;
  public sensor_id!: string;
  public user_id!: string;
  public status!: AnalysisStatus;
  public type!: AnalysisType;
  public parameters!: {
    timeRange: {
      start: string;
      end: string;
    };
    [key: string]: any;
  };
  public progress?: ProgressInfo;
  public result?: any;
  public created_at!: Date;
  public updated_at!: Date;

  static associate(models: any) {
    SensorAnalytics.belongsTo(models.Sensor, { foreignKey: 'sensor_id' });
    SensorAnalytics.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}

export default (sequelize: Sequelize) => {
  SensorAnalytics.init(
    {
      analytics_id: {
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
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id',
        },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(AnalysisStatus)),
        allowNull: false,
        defaultValue: AnalysisStatus.PENDING
      },
      type: {
        type: DataTypes.ENUM(...Object.values(AnalysisType)),
        allowNull: false,
      },
      parameters: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      progress: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      result: {
        type: DataTypes.JSONB,
        allowNull: true,
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
      modelName: 'SensorAnalytics',
      tableName: 'SensorAnalytics',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return SensorAnalytics;
};