"use strict";

const TABLE = "provisioning_pipelines";

const getProvisioningPipelinesColumns = (Sequelize) => ({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tenantId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: "tenants", key: "id" },
    onDelete: "CASCADE",
  },
  actorUserId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM("running", "paused", "completed", "failed", "rolled_back"),
    allowNull: false,
    defaultValue: "running",
  },
  currentStepIndex: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  steps: {
    type: Sequelize.JSON,
    allowNull: false,
    defaultValue: [],
  },
  error: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  startedAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  completedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
});

const createTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable(TABLE, getProvisioningPipelinesColumns(Sequelize));
};

const addIndexes = async (queryInterface) => {
  await queryInterface.addIndex(TABLE, ["tenantId"], { unique: true });
  await queryInterface.addIndex(TABLE, ["status"]);
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await createTable(queryInterface, Sequelize);
    await addIndexes(queryInterface);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(TABLE);
  },
};