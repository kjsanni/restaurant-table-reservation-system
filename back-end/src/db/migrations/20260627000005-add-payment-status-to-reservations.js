"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE Reservations MODIFY COLUMN resStatus ENUM('pending', 'seated', 'missed', 'cancelled') NOT NULL DEFAULT 'pending'"
    );

    await queryInterface.addColumn("Reservations", "paymentStatus", {
      type: Sequelize.ENUM("deposit", "partial", "paid", "unpaid"),
      allowNull: false,
      defaultValue: "unpaid",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Reservations", "paymentStatus");
    await queryInterface.changeColumn("Reservations", "resStatus", {
      type: Sequelize.ENUM("pending", "seated", "missed"),
      defaultValue: "pending",
    });
  },
};
