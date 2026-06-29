"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("customers", "visitCount", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("customers", "lastVisitDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("customers", "tags", {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("customers", "visitCount");
    await queryInterface.removeColumn("customers", "lastVisitDate");
    await queryInterface.removeColumn("customers", "tags");
  },
};
