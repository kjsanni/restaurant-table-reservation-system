"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const TenantNote = sequelize.define(
    "tenantNote",
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: false },
    },
    {
      sequelize,
      modelName: "tenantNote",
      tableName: "tenant_notes",
      timestamps: false,
    }
  );

  return TenantNote;
};
