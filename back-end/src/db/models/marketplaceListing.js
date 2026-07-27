"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MarketplaceListing extends Model {
    static associate(models) {
      MarketplaceListing.belongsTo(models.tenant, {
        foreignKey: "tenantId",
        onDelete: "SET NULL",
      });
    }
  }

  MarketplaceListing.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "marketplaceListing",
      tableName: "marketplace_listings",
    }
  );

  return MarketplaceListing;
};
