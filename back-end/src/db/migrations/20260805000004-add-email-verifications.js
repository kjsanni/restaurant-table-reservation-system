"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "emailVerified", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.createTable("email_verifications", {
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
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      usedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("email_verifications", ["token"], { unique: true });
    await queryInterface.addIndex("email_verifications", ["userId"]);
    await queryInterface.addIndex("email_verifications", ["email"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("email_verifications", ["email"]);
    await queryInterface.removeIndex("email_verifications", ["userId"]);
    await queryInterface.removeIndex("email_verifications", ["token"]);
    await queryInterface.dropTable("email_verifications");
    await queryInterface.removeColumn("users", "emailVerified");
  },
};
