"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("support_attachments", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      conversationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ticketId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      messageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      originalName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("support_attachments", ["tenantId"]);
    await queryInterface.addIndex("support_attachments", ["conversationId"]);
    await queryInterface.addIndex("support_attachments", ["ticketId"]);
    await queryInterface.addIndex("support_attachments", ["messageId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("support_attachments");
  },
};
