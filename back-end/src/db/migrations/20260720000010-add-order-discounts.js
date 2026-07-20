"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Orders", "discountType", {
      type: Sequelize.ENUM("percentage", "fixed"),
      allowNull: true,
    });

    await queryInterface.addColumn("Orders", "discountValue", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn("Orders", "discountCode", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addIndex("Orders", ["discountCode"], {
      name: "orders_discount_code",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("Orders", "orders_discount_code");
    await queryInterface.removeColumn("Orders", "discountCode");
    await queryInterface.removeColumn("Orders", "discountValue");
    await queryInterface.removeColumn("Orders", "discountType");
  },
};
