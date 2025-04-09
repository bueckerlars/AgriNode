import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { User as UserType } from '../types/User';

interface UserCreationAttributes extends Optional<UserType, 'user_id'> {}

class User extends Model<UserType, UserCreationAttributes> implements UserType {
  public user_id!: string;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: 'admin' | 'user';
  public created_at!: Date;
  public updated_at!: Date;

  static associate(models: any) {
    // Define associations here if needed
  }
}

export default (sequelize: Sequelize) => {
  User.init(
    {
      user_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user',
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
      modelName: 'User',
      tableName: 'Users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return User;
};