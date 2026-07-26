"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("incident_postmortems", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      incidentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "incidents", key: "id" },
        onDelete: "CASCADE",
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rootCause: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      impact: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      remediation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      followUpActions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("incident_postmortems", ["incidentId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("incident_postmortems");
  },
};
