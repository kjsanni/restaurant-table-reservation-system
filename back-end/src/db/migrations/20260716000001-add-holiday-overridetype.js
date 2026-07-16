"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("holidays", "overrideType", {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("holidays", "overrideType");
  },
};
