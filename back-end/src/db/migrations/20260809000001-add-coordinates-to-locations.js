"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hasLatitude = await queryInterface.describeTable("locations").then(
      (columns) => "latitude" in columns
    );
    const hasLongitude = await queryInterface.describeTable("locations").then(
      (columns) => "longitude" in columns
    );

    if (!hasLatitude) {
      await queryInterface.addColumn("locations", "latitude", {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      });
    }

    if (!hasLongitude) {
      await queryInterface.addColumn("locations", "longitude", {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const hasLatitude = await queryInterface.describeTable("locations").then(
      (columns) => "latitude" in columns
    );
    const hasLongitude = await queryInterface.describeTable("locations").then(
      (columns) => "longitude" in columns
    );

    if (hasLongitude) {
      await queryInterface.removeColumn("locations", "longitude");
    }
    if (hasLatitude) {
      await queryInterface.removeColumn("locations", "latitude");
    }
  },
};
