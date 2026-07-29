"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ErpnextSync extends Model {
    static associate(models) {
      ErpnextSync.belongsTo(models.tenant, {
        foreignKey: "tenantId",
        as: "tenant",
      });
    }
  }
  ErpnextSync.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rtrsEntityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      rtrsEntityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      erpnextDocType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      erpnextDocname: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      erpnextDocStatus: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      syncedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "erpnextSync",
      tableName: "erpnext_syncs",
      indexes: [
        {
          unique: true,
          fields: ["tenantId", "rtrsEntityType", "rtrsEntityId"],
        },
      ],
    }
  );
  return ErpnextSync;
};