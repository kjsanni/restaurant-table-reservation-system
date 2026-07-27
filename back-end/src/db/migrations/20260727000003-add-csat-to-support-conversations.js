"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("support_conversations");
    if (!tableInfo.csatRating) {
      await queryInterface.addColumn("support_conversations", "csatRating", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
    if (!tableInfo.csatFeedback) {
      await queryInterface.addColumn("support_conversations", "csatFeedback", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("support_conversations", "csatRating");
    await queryInterface.removeColumn("support_conversations", "csatFeedback");
  },
};
