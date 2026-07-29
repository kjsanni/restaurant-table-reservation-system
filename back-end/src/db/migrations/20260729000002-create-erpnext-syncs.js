"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("erpnext_syncs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rtrsEntityType: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      rtrsEntityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      erpnextDocType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      erpnextDocname: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      erpnextDocStatus: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      syncedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("erpnext_syncs", {
      unique: true,
      fields: ["tenantId", "rtrsEntityType", "rtrsEntityId"],
      name: "idx_erpnext_sync_tenant_entity",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("erpnext_syncs");
  },
};