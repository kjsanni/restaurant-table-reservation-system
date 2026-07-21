"use strict";

/**
 * Data Subject Access Request (DSAR) records.
 *
 * Stores guest requests under the Ghana Data Protection Act 2012 (Act 843)
 * and GDPR: access, erasure, rectification, portability, restriction, and
 * objection. Each row is the canonical request record; status transitions
 * and staff notes live on this table.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("dsar_requests", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      requestType: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "pending",
      },
      requestData: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      staffNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fulfilledAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.STRING(512),
        allowNull: true,
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

    await queryInterface.addIndex("dsar_requests", ["tenantId"]);
    await queryInterface.addIndex("dsar_requests", ["status"]);
    await queryInterface.addIndex("dsar_requests", ["requestType"]);
    await queryInterface.addIndex("dsar_requests", ["createdAt"]);
    await queryInterface.addIndex("dsar_requests", ["tenantId", "status"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("dsar_requests");
  },
};
