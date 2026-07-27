"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("salon_client_profiles", "tier", {
      type: Sequelize.ENUM("bronze", "silver", "gold", "platinum"),
      allowNull: false,
      defaultValue: "bronze",
    });

    await queryInterface.addColumn("salon_client_profiles", "totalVisits", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("salon_client_profiles", "totalSpent", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("salon_client_profiles", "noShowCount", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("salon_client_profiles", "lastVisitAt", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn("salon_client_profiles", "lastNoShowAt", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addIndex("salon_client_profiles", ["tenantId", "tier"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("salon_client_profiles", "lastNoShowAt");
    await queryInterface.removeColumn("salon_client_profiles", "lastVisitAt");
    await queryInterface.removeColumn("salon_client_profiles", "noShowCount");
    await queryInterface.removeColumn("salon_client_profiles", "totalSpent");
    await queryInterface.removeColumn("salon_client_profiles", "totalVisits");
    await queryInterface.removeColumn("salon_client_profiles", "tier");
  },
};
