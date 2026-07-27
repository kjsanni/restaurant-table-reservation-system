"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("support_tickets", "source", {
      type: Sequelize.ENUM("web", "whatsapp", "email", "phone"),
      allowNull: false,
      defaultValue: "web",
    });

    await queryInterface.addColumn("support_tickets", "csat", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("support_tickets", "firstResponseAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("support_tickets", ["source"]);
    await queryInterface.addIndex("support_tickets", ["resolvedAt"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("support_tickets", ["resolvedAt"]);
    await queryInterface.removeIndex("support_tickets", ["source"]);
    await queryInterface.removeColumn("support_tickets", "firstResponseAt");
    await queryInterface.removeColumn("support_tickets", "csat");
    await queryInterface.removeColumn("support_tickets", "source");
  },
};
