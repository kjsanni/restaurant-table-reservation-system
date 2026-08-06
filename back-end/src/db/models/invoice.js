"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "invoice",
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: false },
      locationId: { type: DataTypes.INTEGER, allowNull: true },
      invoiceNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "GHS" },
      status: {
        type: DataTypes.ENUM("draft", "sent", "paid", "overdue", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      dueDate: { type: DataTypes.DATE, allowNull: true },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      lineItems: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "invoice",
      tableName: "invoices",
      timestamps: false,
    }
  );

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.location, { foreignKey: "locationId", as: "location" });
  };

  return Invoice;
};
