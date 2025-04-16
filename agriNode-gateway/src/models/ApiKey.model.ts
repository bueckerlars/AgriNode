import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ApiKey as ApiKeyType } from '../types/ApiKey';

interface ApiKeyCreationAttributes extends Optional<ApiKeyType, 'api_key_id' | 'created_at'> {}

class ApiKey extends Model<ApiKeyType, ApiKeyCreationAttributes> implements ApiKeyType {
  public api_key_id!: string;
  public user_id!: string;
  public name!: string;
  public key!: string;
  public created_at!: Date;

  static associate(models: any) {
    ApiKey.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}

export default (sequelize: Sequelize) => {
  ApiKey.init(
    {
      api_key_id: { type: DataTypes.STRING, primaryKey: true },
      user_id: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false, unique: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    {
      sequelize,
      modelName: 'ApiKey',
      tableName: 'ApiKeys',
      timestamps: false
    }
  );

  return ApiKey;
};