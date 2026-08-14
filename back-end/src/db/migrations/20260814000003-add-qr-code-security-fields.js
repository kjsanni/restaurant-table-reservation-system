"use strict";

const TABLE = "QRCodes";
const COLS = {
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

const existingColumns = new Set();

const columnExists = async (queryInterface, tableName, columnName) => {
  if (existingColumns.has(columnName)) return true;
  const cols = await queryInterface.describeTable(tableName);
  if (cols[columnName]) {
    existingColumns.add(columnName);
    return true;
  }
  return false;
};

const columnDefinitions = (Sequelize) => ({
  [COLS.tokenHash]: {
    type: Sequelize.STRING(64),
    allowNull: true,
    unique: true,
    after: "code",
  },
  [COLS.maxUses]: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
    after: "status",
  },
  [COLS.usedCount]: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
    after: "maxUses",
  },
  [COLS.validFrom]: {
    type: Sequelize.DATE,
    allowNull: true,
    after: "expiresAt",
  },
  [COLS.attendeeName]: {
    type: Sequelize.STRING(90),
    allowNull: true,
    after: COLS.validFrom,
  },
  [COLS.photoRef]: {
    type: Sequelize.STRING(64),
    allowNull: true,
    after: COLS.attendeeName,
  },
  [COLS.seat]: {
    type: Sequelize.STRING(20),
    allowNull: true,
    after: COLS.photoRef,
  },
  [COLS.tier]: {
    type: Sequelize.STRING(20),
    allowNull: true,
    after: COLS.seat,
  },
  [COLS.ticketType]: {
    type: Sequelize.STRING(50),
    allowNull: true,
    after: COLS.tier,
  },
});

const addMissingColumns = async (queryInterface, Sequelize) => {
  const defs = columnDefinitions(Sequelize);
  const added = [];
  for (const col of Object.keys(defs)) {
    if (!(await columnExists(queryInterface, TABLE, col))) {
      await queryInterface.addColumn(TABLE, col, defs[col]);
      added.push(col);
    }
  }
  if (added.length > 0) {
    // eslint-disable-next-line no-console
    console.info(`[migration] Added columns to ${TABLE}: ${added.join(", ")}`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await addMissingColumns(queryInterface, Sequelize);
  },

  async down(queryInterface, Sequelize) {
    for (const col of [COLS.ticketType, COLS.tier, COLS.seat, COLS.photoRef, COLS.attendeeName, COLS.validFrom, COLS.usedCount, COLS.maxUses, COLS.tokenHash]) {
      if (await columnExists(queryInterface, TABLE, col)) {
        await queryInterface.removeColumn(TABLE, col);
      }
    }
  },
};