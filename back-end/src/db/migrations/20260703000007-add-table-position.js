"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Tables", "positionX", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn("Tables", "positionY", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn("Tables", "floorPlanId", {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: "default",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Tables", "positionX");
    await queryInterface.removeColumn("Tables", "positionY");
    await queryInterface.removeColumn("Tables", "floorPlanId");
  },
};