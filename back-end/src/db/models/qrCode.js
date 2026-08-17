"use strict";
const { Model } = require("sequelize");

const getQRCodeAttributes = (DataTypes) => ({ // codacy-suppress method-length
  tenantId: { type: DataTypes.INTEGER, allowNull: true },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { notEmpty: { args: true, msg: "Event is required" } },
  },
  guestListId: { type: DataTypes.INTEGER, allowNull: true },
  code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { notEmpty: { args: true, msg: "QR code is required" } },
  },
  tokenHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
    comment: "SHA-256 hash of the raw token — never store raw tokens",
  },
  status: {
    type: DataTypes.ENUM("active", "used", "expired", "cancelled"),
    allowNull: false,
    defaultValue: "active",
  },
  maxUses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: "1 = single-use, >1 = multi-use (e.g. group passes)",
  },
  usedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  checkedInAt: { type: DataTypes.DATE, allowNull: true },
  checkedInById: { type: DataTypes.INTEGER, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  validFrom: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Token not valid for scanning before this timestamp",
  },
  attendeeName: {
    type: DataTypes.STRING(90),
    allowNull: true,
    comment: "Personalized attendee name for gate verification",
  },
  photoRef: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: "SHA-256 reference — photo fetched server-side by scanner",
  },
  seat: { type: DataTypes.STRING(20), allowNull: true },
  tier: { type: DataTypes.STRING(20), allowNull: true },
  ticketType: { type: DataTypes.STRING(50), allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
});

module.exports = (sequelize, DataTypes) => {
  class QRCode extends Model {
    static associate(models) {
      if (models.tenant) {
        QRCode.belongsTo(models.tenant, { foreignKey: "tenantId", onDelete: "SET NULL" });
      }
      if (models.event) {
        QRCode.belongsTo(models.event, { foreignKey: "eventId", onDelete: "CASCADE" });
      }
      if (models.guestList) {
        QRCode.belongsTo(models.guestList, { foreignKey: "guestListId", onDelete: "SET NULL" });
      }
    }
  }

  QRCode.init(getQRCodeAttributes(DataTypes), {
    sequelize,
    tableName: "QRCodes",
    timestamps: true,
    indexes: [
      { fields: ["code"], unique: true },
      { fields: ["tokenHash"], unique: true },
      { fields: ["tenantId"] },
      { fields: ["eventId"] },
      { fields: ["guestListId"] },
      { fields: ["expiresAt"] },
    ],
  });

  return QRCode;
};
