"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("subscription_plans", null, {});

    await queryInterface.bulkInsert("subscription_plans", [
      {
        name: "Starter",
        slug: "starter",
        price: 299,
        currency: "GHS",
        maxTables: 10,
        maxReservationsPerMonth: 500,
        isActive: true,
        sortOrder: 1,
        gracePeriodDays: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Growth",
        slug: "growth",
        price: 599,
        currency: "GHS",
        maxTables: 25,
        maxReservationsPerMonth: 2000,
        isActive: true,
        sortOrder: 2,
        gracePeriodDays: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Scale",
        slug: "scale",
        price: 999,
        currency: "GHS",
        maxTables: 100,
        maxReservationsPerMonth: 10000,
        isActive: true,
        sortOrder: 3,
        gracePeriodDays: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("subscription_plans", null, {});
  },
};
