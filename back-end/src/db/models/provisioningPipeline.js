"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProvisioningPipeline extends Model {
    static associate(models) {
      ProvisioningPipeline.belongsTo(models.tenant, {
        foreignKey: "tenantId",
        as: "tenant",
        onDelete: "CASCADE",
      });
    }
  }

  ProvisioningPipeline.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      actorUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("running", "paused", "completed", "failed", "rolled_back"),
        allowNull: false,
        defaultValue: "running",
      },
      currentStepIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      steps: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      error: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "provisioningPipeline",
      tableName: "provisioning_pipelines",
    }
  );

  return ProvisioningPipeline;
};
