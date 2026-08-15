"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("provisioning_pipelines", {
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

    await queryInterface.addIndex("provisioning_pipelines", ["tenantId"], { unique: true });
    await queryInterface.addIndex("provisioning_pipelines", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("provisioning_pipelines");
  },
};
