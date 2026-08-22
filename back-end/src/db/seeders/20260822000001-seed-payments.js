"use strict";

module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM payments WHERE tenantId = 1 LIMIT 5`
    );

    if (!existing || existing.length === 0) {
      const now = new Date();
      const payments = [];
      const methods = ["cash", "card", "transfer"];
      const amounts = [50, 120, 85, 200, 45, 150, 300, 75];

      for (let i = 0; i < 24; i++) {
        const daysAgo = Math.floor(Math.random() * 365);
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        payments.push({
          tenantId: 1,
          amount: amounts[i % amounts.length],
          currency: "GHS",
          method: methods[i % methods.length],
          paidBy: `Customer ${i + 1}`,
          reference: `PAY-${1000 + i}`,
          createdAt: date,
          updatedAt: date,
        });
      }

      await queryInterface.bulkInsert("payments", payments);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("payments", { tenantId: 1 });
  },
};
