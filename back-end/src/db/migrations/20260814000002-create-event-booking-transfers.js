"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("event_booking_transfers", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      eventBookingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      fromEmail: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      fromName: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      toEmail: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      toName: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      transferredAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      transferredBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
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
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("event_booking_transfers", ["tenantId", "eventBookingId"]);
    await queryInterface.addIndex("event_booking_transfers", ["transferredAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("event_booking_transfers");
  },
};
