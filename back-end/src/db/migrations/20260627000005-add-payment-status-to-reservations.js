"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE reservations MODIFY COLUMN resStatus ENUM('pending', 'seated', 'missed', 'cancelled') NOT NULL DEFAULT 'pending'"
    );

    await queryInterface.addColumn("reservations", "paymentStatus", {
      type: Sequelize.ENUM("deposit", "partial", "paid", "unpaid"),
      allowNull: false,
      defaultValue: "unpaid",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("reservations", "paymentStatus");
    await queryInterface.changeColumn("reservations", "resStatus", {
      type: Sequelize.ENUM("pending", "seated", "missed"),
      defaultValue: "pending",
    });
  },
};
