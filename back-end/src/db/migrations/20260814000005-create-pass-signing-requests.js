"use strict";

const TABLE = "pass_signing_requests";
const ARTIFACT_TABLE = "signed_pass_artifacts";

const tableExists = async (queryInterface, tableName) => {
  const exists = await queryInterface.tableExists(tableName);
  return Boolean(exists);
};

const indexExists = async (queryInterface, tableName, indexName) => {
  const indexes = await queryInterface.sequelize.query(
    `SELECT index_name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    { replacements: [tableName, indexName], plain: true }
  );
  return Boolean(indexes);
};

const getPassSigningRequestColumns = (Sequelize) => ({
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

const getSignedPassArtifactColumns = (Sequelize) => ({
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

const createPassSigningRequestTable = async (queryInterface, Sequelize) => {
  const exists = await tableExists(queryInterface, TABLE);
  if (!exists) {
    await queryInterface.createTable(TABLE, getPassSigningRequestColumns(Sequelize));
  }
};

const createSignedPassArtifactTable = async (queryInterface, Sequelize) => {
  const exists = await tableExists(queryInterface, ARTIFACT_TABLE);
  if (!exists) {
    await queryInterface.createTable(ARTIFACT_TABLE, getSignedPassArtifactColumns(Sequelize));
  }
};

const ensurePassSigningRequestIndex = async (queryInterface) => {
  const exists = await indexExists(queryInterface, TABLE, "idx_pass_signing_requests_tenant");
  if (!exists) {
    await queryInterface.addIndex(TABLE, ["tenantId"], { name: "idx_pass_signing_requests_tenant" });
  }
};

const ensureSignedPassArtifactIndex = async (queryInterface) => {
  const exists = await indexExists(queryInterface, ARTIFACT_TABLE, "idx_signed_pass_artifacts_request");
  if (!exists) {
    await queryInterface.addIndex(ARTIFACT_TABLE, ["requestId"], { name: "idx_signed_pass_artifacts_request" });
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await createPassSigningRequestTable(queryInterface, Sequelize);
    await createSignedPassArtifactTable(queryInterface, Sequelize);
    await ensurePassSigningRequestIndex(queryInterface);
    await ensureSignedPassArtifactIndex(queryInterface);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable(ARTIFACT_TABLE);
    await queryInterface.dropTable(TABLE);
  },
};