"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ServiceCategory extends Model {
    static associate(models) {}
  }
  ServiceCategory.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "serviceCategory",
      tableName: "service_categories",
    }
  );
  return ServiceCategory;
};
