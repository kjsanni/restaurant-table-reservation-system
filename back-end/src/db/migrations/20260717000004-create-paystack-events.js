"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("paystackEvents", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      paystackEventId: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tenants", key: "id" },
        onDelete: "SET NULL",
      },
      event: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("paystackEvents", ["paystackEventId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("paystackEvents");
  },
};
