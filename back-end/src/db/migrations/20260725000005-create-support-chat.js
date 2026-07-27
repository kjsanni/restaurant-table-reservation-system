"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("support_conversations", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      assignedTo: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("open", "in_progress", "resolved", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
      priority: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      slaDeadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolvedAt: {
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("support_messages", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      conversationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      senderType: {
        type: Sequelize.ENUM("customer", "agent", "system"),
        allowNull: false,
        defaultValue: "customer",
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("support_conversations", ["tenantId"]);
    await queryInterface.addIndex("support_conversations", ["status"]);
    await queryInterface.addIndex("support_conversations", ["slaDeadline"]);
    await queryInterface.addIndex("support_messages", ["conversationId"]);
    await queryInterface.addIndex("support_messages", ["createdAt"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("support_messages");
    await queryInterface.dropTable("support_conversations");
  },
};
