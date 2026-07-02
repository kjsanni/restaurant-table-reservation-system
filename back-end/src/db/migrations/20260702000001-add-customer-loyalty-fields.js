"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Customers", "visitCount", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("Customers", "lastVisitDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("Customers", "tags", {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });

    await queryInterface.addIndex("Customers", ["email"], {
      unique: true,
      name: "unique_email",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("Customers", "unique_email");
    await queryInterface.removeColumn("Customers", "tags");
    await queryInterface.removeColumn("Customers", "lastVisitDate");
    await queryInterface.removeColumn("Customers", "visitCount");
  },
};
