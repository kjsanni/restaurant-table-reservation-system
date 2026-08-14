"use strict";
/** @type {import('sequelize-cli').Migration} */

const getEventsColumns = (Sequelize) => ({
  id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  tenantId: { type: Sequelize.INTEGER, allowNull: true },
  createdById: { type: Sequelize.INTEGER, allowNull: true },
  name: { type: Sequelize.STRING(255), allowNull: false },
  description: { type: Sequelize.TEXT, allowNull: true },
  eventType: { type: Sequelize.STRING(50), allowNull: true },
  venue: { type: Sequelize.STRING(255), allowNull: true },
  address: { type: Sequelize.TEXT, allowNull: true },
  eventDate: { type: Sequelize.DATEONLY, allowNull: false },
  startTime: { type: Sequelize.TIME, allowNull: true },
  endTime: { type: Sequelize.TIME, allowNull: true },
  capacity: { type: Sequelize.INTEGER, allowNull: true },
  status: { type: Sequelize.ENUM("draft", "published", "cancelled", "completed"), allowNull: false, defaultValue: "draft" },
  isTicketed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  requiresApproval: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  checkinEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  metadata: { type: Sequelize.JSON, allowNull: true },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});

const getTicketTypesColumns = (Sequelize) => ({
  id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  tenantId: { type: Sequelize.INTEGER, allowNull: true },
  eventId: { type: Sequelize.INTEGER, allowNull: false },
  name: { type: Sequelize.STRING(255), allowNull: false },
  description: { type: Sequelize.TEXT, allowNull: true },
  price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
  currency: { type: Sequelize.STRING(3), allowNull: true, defaultValue: "GHS" },
  quantity: { type: Sequelize.INTEGER, allowNull: true },
  soldCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  metadata: { type: Sequelize.JSON, allowNull: true },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});

const getGuestListsColumns = (Sequelize) => ({
  id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  tenantId: { type: Sequelize.INTEGER, allowNull: true },
  eventId: { type: Sequelize.INTEGER, allowNull: false },
  customerId: { type: Sequelize.INTEGER, allowNull: true },
  guestName: { type: Sequelize.STRING(255), allowNull: false },
  guestEmail: { type: Sequelize.STRING(255), allowNull: true },
  guestPhone: { type: Sequelize.STRING(50), allowNull: true },
  ticketTypeId: { type: Sequelize.INTEGER, allowNull: true },
  qrCodeId: { type: Sequelize.INTEGER, allowNull: true },
  status: {
    type: Sequelize.ENUM("invited", "confirmed", "checked_in", "cancelled", "no_show"),
    allowNull: false,
    defaultValue: "invited",
  },
  checkedInAt: { type: Sequelize.DATE, allowNull: true },
  checkedInById: { type: Sequelize.INTEGER, allowNull: true },
  notes: { type: Sequelize.TEXT, allowNull: true },
  metadata: { type: Sequelize.JSON, allowNull: true },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});

const getQRCodesColumns = (Sequelize) => ({
  id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
  tenantId: { type: Sequelize.INTEGER, allowNull: true },
  eventId: { type: Sequelize.INTEGER, allowNull: false },
  guestListId: { type: Sequelize.INTEGER, allowNull: true },
  code: { type: Sequelize.STRING(255), allowNull: false, unique: true },
  status: { type: Sequelize.ENUM("active", "used", "expired", "cancelled"), allowNull: false, defaultValue: "active" },
  checkedInAt: { type: Sequelize.DATE, allowNull: true },
  checkedInById: { type: Sequelize.INTEGER, allowNull: true },
  expiresAt: { type: Sequelize.DATE, allowNull: true },
  metadata: { type: Sequelize.JSON, allowNull: true },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});

const createEventsTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("Events", getEventsColumns(Sequelize));
};

const createTicketTypesTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("TicketTypes", getTicketTypesColumns(Sequelize));
};

const createGuestListsTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("GuestLists", getGuestListsColumns(Sequelize));
};

const createQRCodesTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("QRCodes", getQRCodesColumns(Sequelize));
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await createEventsTable(queryInterface, Sequelize);
    await createTicketTypesTable(queryInterface, Sequelize);
    await createGuestListsTable(queryInterface, Sequelize);
    await createQRCodesTable(queryInterface, Sequelize);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("QRCodes");
    await queryInterface.dropTable("GuestLists");
    await queryInterface.dropTable("TicketTypes");
    await queryInterface.dropTable("Events");
  },
};