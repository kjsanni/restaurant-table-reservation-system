"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("tenants");
    if (tableInfo.paystackPublicKey) {
      await queryInterface.removeColumn("tenants", "paystackPublicKey");
    }
    if (tableInfo.paystackSecretKey) {
      await queryInterface.removeColumn("tenants", "paystackSecretKey");
    }
  },

  down: async (queryInterface, Sequelize) => {
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
};
