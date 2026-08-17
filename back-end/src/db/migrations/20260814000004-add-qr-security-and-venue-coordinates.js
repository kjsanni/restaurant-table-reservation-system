"use strict";

const EVENT_COLS = {
  venueLatitude: "venueLatitude",
  venueLongitude: "venueLongitude",
};

const QR_COLS = {
  tokenHash: "tokenHash",
  maxUses: "maxUses",
  usedCount: "usedCount",
  validFrom: "validFrom",
  attendeeName: "attendeeName",
  photoRef: "photoRef",
  seat: "seat",
  tier: "tier",
  ticketType: "ticketType",
};

const eventExisting = new Set();
const qrExisting = new Set();

const columnExists = async (queryInterface, tableName, columnName, cache) => {
  if (cache.has(columnName)) return true;
  const cols = await queryInterface.describeTable(tableName);
  if (cols[columnName]) {
    cache.add(columnName);
    return true;
  }
  return false;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const addedEvent = [];

    if (!(await columnExists(queryInterface, "Events", EVENT_COLS.venueLatitude, eventExisting))) {
      await queryInterface.addColumn("Events", EVENT_COLS.venueLatitude, {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        after: "checkinEnabled",
      });
      addedEvent.push(EVENT_COLS.venueLatitude);
    }

    if (!(await columnExists(queryInterface, "Events", EVENT_COLS.venueLongitude, eventExisting))) {
      await queryInterface.addColumn("Events", EVENT_COLS.venueLongitude, {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        after: EVENT_COLS.venueLatitude,
      });
      addedEvent.push(EVENT_COLS.venueLongitude);
    }

    const addedQr = [];
    for (const [key, col] of Object.entries(QR_COLS)) {
      if (!(await columnExists(queryInterface, "QRCodes", col, qrExisting))) {
        const colDef = {
          tokenHash: { type: Sequelize.STRING(64), allowNull: true, unique: true, after: "code" },
          maxUses: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1, after: "status" },
          usedCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, after: "maxUses" },
          validFrom: { type: Sequelize.DATE, allowNull: true, after: "expiresAt" },
          attendeeName: { type: Sequelize.STRING(90), allowNull: true, after: "validFrom" },
          photoRef: { type: Sequelize.STRING(64), allowNull: true, after: "attendeeName" },
          seat: { type: Sequelize.STRING(20), allowNull: true, after: "photoRef" },
          tier: { type: Sequelize.STRING(20), allowNull: true, after: "seat" },
          ticketType: { type: Sequelize.STRING(50), allowNull: true, after: "tier" },
        };
        await queryInterface.addColumn("QRCodes", col, colDef[col]);
        addedQr.push(col);
      }
    }

    if (!(await columnExists(queryInterface, "QRCodes", "tokenHash", qrExisting))) {
      await queryInterface.addIndex("QRCodes", ["tokenHash"], { name: "qr_codes_token_hash_idx" });
      await queryInterface.addIndex("QRCodes", ["tenantId"], { name: "qr_codes_tenant_id_idx_v2" });
      await queryInterface.addIndex("QRCodes", ["usedCount", "maxUses"], { name: "qr_codes_usage_idx" });
    }

    if (addedEvent.length > 0) {
      // eslint-disable-next-line no-console
      console.info(`[migration] Added to Events: ${addedEvent.join(", ")}`);
    }
    if (addedQr.length > 0) {
      // eslint-disable-next-line no-console
      console.info(`[migration] Added to QRCodes: ${addedQr.join(", ")}`);
    }
  },

  async down(queryInterface, Sequelize) {
    for (const col of Object.values(QR_COLS)) {
      if (await columnExists(queryInterface, "QRCodes", col, qrExisting)) {
        await queryInterface.removeColumn("QRCodes", col);
      }
    }

    for (const col of [EVENT_COLS.venueLongitude, EVENT_COLS.venueLatitude]) {
      if (await columnExists(queryInterface, "Events", col, eventExisting)) {
        await queryInterface.removeColumn("Events", col);
      }
    }
  },
};
