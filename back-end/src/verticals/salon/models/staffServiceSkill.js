"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class StaffServiceSkill extends Model {
    static associate(models) {
      StaffServiceSkill.belongsTo(models.user, {
        foreignKey: "userId",
        as: "user",
      });
      StaffServiceSkill.belongsTo(models.service, {
        foreignKey: "serviceId",
        as: "service",
      });
    }
  }
  StaffServiceSkill.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      skillLevel: {
        type: DataTypes.ENUM("trainee", "proficient", "expert"),
        allowNull: false,
        defaultValue: "proficient",
      },
    },
    {
      sequelize,
      modelName: "staffServiceSkill",
      tableName: "staff_service_skills",
    }
  );
  return StaffServiceSkill;
};
