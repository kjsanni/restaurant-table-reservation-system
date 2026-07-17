"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservation_status_history", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reservationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      fromStatus: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      toStatus: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      actorType: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("reservation_status_history", ["reservationId"]);
    await queryInterface.addIndex("reservation_status_history", ["createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("reservation_status_history");
  },
};
