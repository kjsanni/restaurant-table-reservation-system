"use strict";
/** @type {import('sequelize-cli').Migration} */

const TABLE = "event_booking_transfers";

const getEventBookingTransfersColumns = (Sequelize) => ({
  id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  tenantId: { type: Sequelize.INTEGER, allowNull: true },
  eventBookingId: { type: Sequelize.INTEGER, allowNull: false },
  fromEmail: { type: Sequelize.STRING(255), allowNull: true },
  fromName: { type: Sequelize.STRING(255), allowNull: true },
  toEmail: { type: Sequelize.STRING(255), allowNull: true },
  toName: { type: Sequelize.STRING(255), allowNull: true },
  transferredAt: { allowNull: false, type: Sequelize.DATE },
  transferredBy: { type: Sequelize.INTEGER, allowNull: true },
  reason: { type: Sequelize.TEXT, allowNull: true },
  metadata: { type: Sequelize.JSON, allowNull: true },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});

const createEventBookingTransfersTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable(TABLE, getEventBookingTransfersColumns(Sequelize));
};

const addIndexes = async (queryInterface) => {
  await queryInterface.addIndex(TABLE, ["tenantId", "eventBookingId"]);
  await queryInterface.addIndex(TABLE, ["transferredAt"]);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await createEventBookingTransfersTable(queryInterface, Sequelize);
    await addIndexes(queryInterface);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE);
  },
};