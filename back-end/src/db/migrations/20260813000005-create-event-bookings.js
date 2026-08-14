"use strict";
/** @type {import('sequelize-cli').Migration} */

const TABLE = "EventBookings";

const getEventBookingsColumns = (Sequelize) => ({
  id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  tenantId: { type: Sequelize.INTEGER, allowNull: true },
  eventId: { type: Sequelize.INTEGER, allowNull: false },
  ticketTypeId: { type: Sequelize.INTEGER, allowNull: true },
  customerId: { type: Sequelize.INTEGER, allowNull: true },
  userId: { type: Sequelize.INTEGER, allowNull: true },
  quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
  unitPrice: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  total: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: { type: Sequelize.ENUM("pending", "confirmed", "cancelled", "refunded"), allowNull: false, defaultValue: "pending" },
  paymentStatus: { type: Sequelize.ENUM("unpaid", "paid", "failed", "refunded"), allowNull: false, defaultValue: "unpaid" },
  paymentReference: { type: Sequelize.STRING(255), allowNull: true },
  paymentMethod: { type: Sequelize.STRING(50), allowNull: true },
  currency: { type: Sequelize.STRING(3), allowNull: true, defaultValue: "GHS" },
  guestName: { type: Sequelize.STRING(255), allowNull: true },
  guestEmail: { type: Sequelize.STRING(255), allowNull: true },
  guestPhone: { type: Sequelize.STRING(50), allowNull: true },
  notes: { type: Sequelize.TEXT, allowNull: true },
  metadata: { type: Sequelize.JSON, allowNull: true },
  bookedAt: { type: Sequelize.DATE, allowNull: true },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});

const createEventBookingsTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable(TABLE, getEventBookingsColumns(Sequelize));
};

const addIndexes = async (queryInterface) => {
  await queryInterface.addIndex(TABLE, ["tenantId", "eventId"]);
  await queryInterface.addIndex(TABLE, ["customerId"]);
  await queryInterface.addIndex(TABLE, ["paymentReference"]);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await createEventBookingsTable(queryInterface, Sequelize);
    await addIndexes(queryInterface);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE);
  },
};