"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PaystackEvent extends Model {
    static associate(models) {
      if (models.tenant) {
        PaystackEvent.belongsTo(models.tenant, {
          foreignKey: "tenantId",
          allowNull: true,
        });
      }
    }
  }
  PaystackEvent.init(
    {
      paystackEventId: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      event: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "paystackEvent",
      tableName: "paystackEvents",
    }
  );
  return PaystackEvent;
};
