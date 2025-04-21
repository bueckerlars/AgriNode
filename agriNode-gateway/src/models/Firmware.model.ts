import { Model, DataTypes, Sequelize } from 'sequelize';
import semver from 'semver';

class Firmware extends Model {
  public firmware_id!: string;
  public version!: string;
  public file_path!: string;
  public active!: boolean;
  public created_at!: Date;
  public checksum!: string;

  // Utility method to check if this version is newer than another
  public isNewerThan(otherVersion: string): boolean {
    return semver.gt(this.version, otherVersion);
  }

  static associate(models: any) {

  }
}

export default (sequelize: Sequelize) => {
  Firmware.init(
    {
      firmware_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      version: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isSemVer(value: string) {
            if (!semver.valid(value)) {
              throw new Error('Version must be a valid semantic version (e.g., 1.0.0)');
            }
          },
        },
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      checksum: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'firmwares',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['version'],
        },
      ],
    }
  );

  return Firmware;
}
