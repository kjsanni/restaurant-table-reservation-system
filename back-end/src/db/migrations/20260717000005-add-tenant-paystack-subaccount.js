"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("tenants", "paystackSubaccountCode", {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: "paystackAuthorization",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tenants", "paystackSubaccountCode");
  },
};
