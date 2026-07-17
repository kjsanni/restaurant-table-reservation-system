"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("tenants", "paystackPublicKey", {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: "paystackSubaccountCode",
    });
    await queryInterface.addColumn("tenants", "paystackSecretKey", {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: "paystackPublicKey",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tenants", "paystackPublicKey");
    await queryInterface.removeColumn("tenants", "paystackSecretKey");
  },
};
