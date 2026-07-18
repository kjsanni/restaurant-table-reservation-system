"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TableEvent extends Model {
    static associate(models) {
      TableEvent.belongsTo(models.table, {
        foreignKey: "tableId",
        onDelete: "cascade",
      });
      TableEvent.belongsTo(models.user, {
        foreignKey: "actorId",
        allowNull: true,
      });
    }
  }
  TableEvent.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tableId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      eventType: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      actorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "tableEvent",
      tableName: "TableEvents",
    }
  );
  return TableEvent;
};
