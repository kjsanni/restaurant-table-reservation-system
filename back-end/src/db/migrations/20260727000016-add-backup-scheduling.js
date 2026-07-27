"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("backup_records", "frequency", {
      type: Sequelize.ENUM("daily", "weekly", "monthly"),
      allowNull: true,
    });

    await queryInterface.addColumn("backup_records", "nextRunAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("backup_records", "lastRunAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("backup_records", ["nextRunAt"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("backup_records", ["nextRunAt"]);
    await queryInterface.removeColumn("backup_records", "lastRunAt");
    await queryInterface.removeColumn("backup_records", "nextRunAt");
    await queryInterface.removeColumn("backup_records", "frequency");
  },
};
