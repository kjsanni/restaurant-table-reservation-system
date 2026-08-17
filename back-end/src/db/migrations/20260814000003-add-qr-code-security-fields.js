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

module.exports = {
  async up(queryInterface, Sequelize) {
    const added = [];

    if (!(await columnExists(queryInterface, TABLE, COLS.tokenHash))) {
      await queryInterface.addColumn(TABLE, COLS.tokenHash, {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
        after: "code",
      });
      added.push(COLS.tokenHash);
    }

    if (!(await columnExists(queryInterface, TABLE, COLS.maxUses))) {
      await queryInterface.addColumn(TABLE, COLS.maxUses, {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        after: "status",
      });
      added.push(COLS.maxUses);
    }

    if (!(await columnExists(queryInterface, TABLE, COLS.usedCount))) {
      await queryInterface.addColumn(TABLE, COLS.usedCount, {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        after: "maxUses",
      });
      added.push(COLS.usedCount);
    }

    if (!(await columnExists(queryInterface, TABLE, COLS.validFrom))) {
      await queryInterface.addColumn(TABLE, COLS.validFrom, {
        type: Sequelize.DATE,
        allowNull: true,
        after: "expiresAt",
      });
      added.push(COLS.validFrom);
    }

    if (!(await columnExists(queryInterface, TABLE, COLS.attendeeName))) {
      await queryInterface.addColumn(TABLE, COLS.attendeeName, {
        type: Sequelize.STRING(90),
        allowNull: true,
        after: "validFrom",
      });
      added.push(COLS.attendeeName);
    }

    if (!(await columnExists(queryInterface, TABLE, COLS.photoRef))) {
      await queryInterface.addColumn(TABLE, COLS.photoRef, {
        type: Sequelize.STRING(64),
        allowNull: true,
        after: COLS.attendeeName,
      });
      added.push(COLS.photoRef);
    }

    if (!(await columnExists(queryInterface, TABLE, COLS.seat))) {
      await queryInterface.addColumn(TABLE, COLS.seat, {
        type: Sequelize.STRING(20),
        allowNull: true,
        after: COLS.photoRef,
      });
      added.push(COLS.seat);
    }

    if (!(await columnExists(queryInterface, TABLE, COLS.tier))) {
      await queryInterface.addColumn(TABLE, COLS.tier, {
        type: Sequelize.STRING(20),
        allowNull: true,
        after: COLS.seat,
      });
      added.push(COLS.tier);
    }

    if (!(await columnExists(queryInterface, TABLE, COLS.ticketType))) {
      await queryInterface.addColumn(TABLE, COLS.ticketType, {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: COLS.tier,
      });
      added.push(COLS.ticketType);
    }

    if (added.length > 0) {
      // eslint-disable-next-line no-console
      console.info(`[migration] Added columns to ${TABLE}: ${added.join(", ")}`);
    }
  },

  async down(queryInterface, Sequelize) {
    for (const col of [COLS.ticketType, COLS.tier, COLS.seat, COLS.photoRef, COLS.attendeeName, COLS.validFrom, COLS.usedCount, COLS.maxUses, COLS.tokenHash]) {
      if (await columnExists(queryInterface, TABLE, col)) {
        await queryInterface.removeColumn(TABLE, col);
      }
    }
  },
};
