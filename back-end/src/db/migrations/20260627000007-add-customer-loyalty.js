"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
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
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Customers", "visitCount");
    await queryInterface.removeColumn("Customers", "lastVisitDate");
    await queryInterface.removeColumn("Customers", "tags");
  },
};
