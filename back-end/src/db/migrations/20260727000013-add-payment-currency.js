"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("payments", "currency", {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: "GHS",
    });

    await queryInterface.addColumn("payments", "exchangeRate", {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true,
    });

    await queryInterface.addColumn("payments", "baseAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addIndex("payments", ["currency"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("payments", ["currency"]);
    await queryInterface.removeColumn("payments", "baseAmount");
    await queryInterface.removeColumn("payments", "exchangeRate");
    await queryInterface.removeColumn("payments", "currency");
  },
};
