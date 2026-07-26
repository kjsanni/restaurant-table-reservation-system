"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class IncidentPostmortem extends Model {
    static associate(models) {
      IncidentPostmortem.belongsTo(models.incident, {
        foreignKey: "incidentId",
        as: "incident",
      });
      IncidentPostmortem.belongsTo(models.user, {
        foreignKey: "createdBy",
        as: "author",
      });
    }
  }
  IncidentPostmortem.init(
    {
      incidentId: { type: DataTypes.INTEGER, allowNull: false },
      summary: { type: DataTypes.TEXT, allowNull: false },
      rootCause: { type: DataTypes.TEXT, allowNull: true },
      impact: { type: DataTypes.TEXT, allowNull: true },
      remediation: { type: DataTypes.TEXT, allowNull: true },
      followUpActions: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "incidentPostmortem",
      tableName: "incident_postmortems",
      indexes: [{ fields: ["incidentId"] }],
    }
  );
  return IncidentPostmortem;
};
