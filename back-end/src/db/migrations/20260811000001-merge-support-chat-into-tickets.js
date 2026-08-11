"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("support_tickets", "conversationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "support_conversations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("support_tickets", "category", {
      type: Sequelize.ENUM(
        "general",
        "billing",
        "technical",
        "onboarding",
        "salon",
        "restaurant"
      ),
      allowNull: false,
      defaultValue: "general",
    });

    await queryInterface.addIndex("support_tickets", ["conversationId"]);
    await queryInterface.addIndex("support_tickets", ["category"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("support_tickets", ["category"]);
    await queryInterface.removeIndex("support_tickets", ["conversationId"]);
    await queryInterface.removeColumn("support_tickets", "category");
    await queryInterface.removeColumn("support_tickets", "conversationId");
  },
};
