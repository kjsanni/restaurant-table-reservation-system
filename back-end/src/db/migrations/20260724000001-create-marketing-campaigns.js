"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("marketing_campaigns", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM("email", "whatsapp", "social", "sms"),
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      targetAudience: {
        type: Sequelize.ENUM("all", "vip", "new", "inactive"),
        allowNull: false,
        defaultValue: "all",
      },
      status: {
        type: Sequelize.ENUM("draft", "scheduled", "sent", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex("marketing_campaigns", ["tenantId", "status"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("marketing_campaigns");
  },
};
