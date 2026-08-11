"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("support_ticket_messages", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ticketId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "support_tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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

    await queryInterface.addIndex("support_ticket_messages", ["ticketId"]);
    await queryInterface.addIndex("support_ticket_messages", ["createdAt"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("support_ticket_messages", ["createdAt"]);
    await queryInterface.removeIndex("support_ticket_messages", ["ticketId"]);
    await queryInterface.dropTable("support_ticket_messages");
  },
};
