"use strict";

const db = require("../../db/models");

module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM tenants WHERE id = 1 LIMIT 1`
    );

    if (!existing || existing.length === 0) {
      await queryInterface.bulkInsert("tenants", [
        {
          id: 1,
          name: "Default Tenant",
          slug: "default",
          status: "active",
          plan: "starter",
          subscriptionStatus: "active",
          currency: "GHS",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("tenants", { id: 1 });
  },
};
