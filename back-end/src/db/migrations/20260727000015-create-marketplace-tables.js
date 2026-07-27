"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "marketplace_listings",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        tenantId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        },
      },
      {
        indexes: [{ fields: ["tenantId"] }, { fields: ["isActive"] }],
      }
    );

    await queryInterface.createTable(
      "case_studies",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        tenantId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        imageUrl: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        isPublished: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        },
      },
      {
        indexes: [{ fields: ["tenantId"] }, { fields: ["isPublished"] }],
      }
    );

    await queryInterface.createTable(
      "platform_referrals",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        referrerTenantId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        referredTenantId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM("pending", "converted", "paid"),
          allowNull: false,
          defaultValue: "pending",
        },
        rewardAmount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
        },
        convertedAt: {
          type: Sequelize.DATE,
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
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        },
      },
      {
        indexes: [
          { fields: ["referrerTenantId"] },
          { fields: ["referredTenantId"] },
          { fields: ["status"] },
        ],
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("platform_referrals");
    await queryInterface.dropTable("case_studies");
    await queryInterface.dropTable("marketplace_listings");
  },
};
