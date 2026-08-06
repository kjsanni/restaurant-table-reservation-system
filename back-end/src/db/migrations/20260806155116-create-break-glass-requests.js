"use strict";

const createBreakGlassRequestTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("break_glass_requests", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    approverId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    justification: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    durationMinutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 240,
    },
    status: {
      type: Sequelize.ENUM("pending", "approved", "denied", "expired", "revoked"),
      allowNull: false,
      defaultValue: "pending",
    },
    elevatedUntil: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    resolvedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });
};

const addBreakGlassRequestIndexes = async (queryInterface) => {
  await queryInterface.addIndex("break_glass_requests", ["userId"]);
  await queryInterface.addIndex("break_glass_requests", ["approverId"]);
  await queryInterface.addIndex("break_glass_requests", ["status"]);
  await queryInterface.addIndex("break_glass_requests", ["elevatedUntil"]);
  await queryInterface.addIndex("break_glass_requests", ["createdAt"]);
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await createBreakGlassRequestTable(queryInterface, Sequelize);
    await addBreakGlassRequestIndexes(queryInterface);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("break_glass_requests");
  },
};
