"use strict";
const { Model } = require("sequelize");

const getGuestListAttributes = (DataTypes) => ({
  tenantId: { type: DataTypes.INTEGER, allowNull: true },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { notEmpty: { args: true, msg: "Event is required" } },
  },
  customerId: { type: DataTypes.INTEGER, allowNull: true },
  guestName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: { args: true, msg: "Guest name is required" } },
  },
  guestEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isEmail: { args: true, msg: "Invalid email address" } },
  },
  guestPhone: { type: DataTypes.STRING(50), allowNull: true },
  ticketTypeId: { type: DataTypes.INTEGER, allowNull: true },
  qrCodeId: { type: DataTypes.INTEGER, allowNull: true },
  status: {
    type: DataTypes.ENUM("invited", "confirmed", "checked_in", "cancelled", "no_show"),
    allowNull: false,
    defaultValue: "invited",
  },
  checkedInAt: { type: DataTypes.DATE, allowNull: true },
  checkedInById: { type: DataTypes.INTEGER, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
});

module.exports = (sequelize, DataTypes) => {
  class GuestList extends Model {
    static associate(models) {
      if (models.tenant) {
        GuestList.belongsTo(models.tenant, { foreignKey: "tenantId", onDelete: "SET NULL" });
      }
      if (models.event) {
        GuestList.belongsTo(models.event, { foreignKey: "eventId", onDelete: "CASCADE" });
      }
      if (models.customer) {
        GuestList.belongsTo(models.customer, { foreignKey: "customerId", onDelete: "SET NULL" });
      }
      if (models.user) {
        GuestList.belongsTo(models.user, { as: "checkedInBy", foreignKey: "checkedInById", onDelete: "SET NULL" });
      }
    }
  }

  GuestList.init(getGuestListAttributes(DataTypes), {
    sequelize,
    tableName: "GuestLists",
    timestamps: true,
  });

  return GuestList;
};
