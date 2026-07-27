"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("support_notes", {
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
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      mentions: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("support_notes", ["tenantId"]);
    await queryInterface.addIndex("support_notes", ["conversationId"]);
    await queryInterface.addIndex("support_notes", ["ticketId"]);
    await queryInterface.addIndex("support_notes", ["userId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("support_notes");
  },
};
