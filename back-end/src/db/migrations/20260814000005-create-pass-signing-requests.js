"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const TABLE = "pass_signing_requests";
    const ARTIFACT_TABLE = "signed_pass_artifacts";

    // Check if table already exists (idempotent)
    const [tables] = await queryInterface.sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${TABLE}'` // nosemgrep: javascript.sequelize.security.audit.sequelize-raw-query.sequelize-raw-query - TABLE is hardcoded constant, no user input
    );

    if (tables.length === 0) {
      await queryInterface.createTable(TABLE, {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        tenantId: { type: Sequelize.INTEGER, allowNull: false },
        eventId: { type: Sequelize.INTEGER, allowNull: true },
        requesterId: { type: Sequelize.INTEGER, allowNull: false },
        reviewerId: { type: Sequelize.INTEGER, allowNull: true },
        designSnapshot: { type: Sequelize.JSON, allowNull: false },
        status: {
          type: Sequelize.ENUM("pending_payment", "pending", "approved", "rejected", "signing", "completed", "failed"),
          allowNull: false,
          defaultValue: "pending_payment",
        },
        paymentReference: { type: Sequelize.STRING(100), allowNull: true },
        amount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
        currency: { type: Sequelize.STRING(3), allowNull: true, defaultValue: "GHS" },
        platformStatuses: { type: Sequelize.JSON, allowNull: true },
        reviewNotes: { type: Sequelize.TEXT, allowNull: true },
        completedAt: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      });
    }

    // Check if artifacts table already exists
    const [artifactTables] = await queryInterface.sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${ARTIFACT_TABLE}'` // nosemgrep: javascript.sequelize.security.audit.sequelize-raw-query.sequelize-raw-query - ARTIFACT_TABLE is hardcoded constant, no user input
    );

    if (artifactTables.length === 0) {
      await queryInterface.createTable(ARTIFACT_TABLE, {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        requestId: { type: Sequelize.INTEGER, allowNull: false },
        platform: { type: Sequelize.ENUM("apple", "google", "samsung"), allowNull: false },
        status: {
          type: Sequelize.ENUM("pending", "signed", "failed"),
          allowNull: false,
          defaultValue: "pending",
        },
        artifactType: { type: Sequelize.ENUM("file", "url"), allowNull: false },
        artifactPath: { type: Sequelize.STRING(500), allowNull: true },
        accessToken: { type: Sequelize.STRING(500), allowNull: true },
        error: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      });
    }

    // Add indexes if they don't exist
    const [indexes] = await queryInterface.sequelize.query(
      `SELECT index_name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = '${TABLE}' AND index_name = 'idx_pass_signing_requests_tenant'` // nosemgrep: javascript.sequelize.security.audit.sequelize-raw-query.sequelize-raw-query - TABLE is hardcoded constant, no user input
    );
    if (indexes.length === 0) {
      await queryInterface.addIndex(TABLE, ["tenantId"], { name: "idx_pass_signing_requests_tenant" });
    }

    const [artifactIndexes] = await queryInterface.sequelize.query(
      `SELECT index_name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = '${ARTIFACT_TABLE}' AND index_name = 'idx_signed_pass_artifacts_request'` // nosemgrep: javascript.sequelize.security.audit.sequelize-raw-query.sequelize-raw-query - ARTIFACT_TABLE is hardcoded constant, no user input
    );
    if (artifactIndexes.length === 0) {
      await queryInterface.addIndex(ARTIFACT_TABLE, ["requestId"], { name: "idx_signed_pass_artifacts_request" });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("signed_pass_artifacts");
    await queryInterface.dropTable("pass_signing_requests");
  },
};
