"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const remainingTables = [
      "refresh_tokens",
      "login_attempts",
    ];

    for (const table of remainingTables) {
      try {
        await queryInterface.addColumn(table, "tenantId", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "tenants", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
        await queryInterface.addIndex(table, ["tenantId"]);
      } catch (err) {
        if (
          err.message.includes("tenantId") &&
          (err.message.includes("already exists") || err.message.includes("Duplicate column"))
        ) {
          console.log(`Column tenantId already exists on ${table}`);
        } else {
          throw err;
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    for (const table of ["refresh_tokens", "login_attempts"]) {
      try {
        await queryInterface.removeColumn(table, "tenantId");
      } catch (err) {
        console.log(`Skip removing tenantId from ${table}: ${err.message}`);
      }
    }
  },
};
