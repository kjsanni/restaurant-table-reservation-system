"use strict";

const { Model } = require("sequelize");

const getExpenseAttributes = (DataTypes) => ({
tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      locationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "GHS",
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
});

module.exports = (sequelize, DataTypes) => {
  class Expense extends Model {
    static associate(models) {
      Expense.belongsTo(models.location, {
        foreignKey: "locationId",
        as: "location",
      });
    }
  }
  Expense.init(getExpenseAttributes(DataTypes), {
    sequelize,
    modelName: "expense",
    tableName: "expenses",
  });
  return Expense;
};
