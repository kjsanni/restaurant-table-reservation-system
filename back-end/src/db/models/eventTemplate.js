"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class EventTemplate extends Model {
    static associate(models) {
      if (models.tenant) {
        EventTemplate.belongsTo(models.tenant, { foreignKey: "tenantId", onDelete: "SET NULL" });
      }
    }
  }

  EventTemplate.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      category: { type: DataTypes.STRING(100), allowNull: true },
      config: { type: DataTypes.JSON, allowNull: true },
      isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      tableName: "event_templates",
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["category"] },
      ],
    }
  );

  return EventTemplate;
};
