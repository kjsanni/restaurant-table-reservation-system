"use strict";

/**
 * Tamper-evident legal acceptance records.
 *
 * Each acceptance of a policy (Merchant Policy, DPA, etc.) is written as an
 * immutable row: who accepted, which tenant, which document slug + version,
 * the source IP and user-agent, and the exact timestamp. These rows are
 * never updated or deleted, giving a verifiable audit trail for compliance
 * (Ghana Data Protection Act, 2012 / GDPR).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("legal_acceptances", {
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
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING(30),
        allowNull: false,
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
    });

    await queryInterface.addIndex("legal_acceptances", ["tenantId"]);
    await queryInterface.addIndex("legal_acceptances", ["slug"]);
    await queryInterface.addIndex("legal_acceptances", ["tenantId", "slug"]);
    await queryInterface.addIndex("legal_acceptances", ["createdAt"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("legal_acceptances");
  },
};
