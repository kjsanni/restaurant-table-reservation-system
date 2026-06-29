"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("waitlist", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      partySize: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      desiredTime: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      notes: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("waiting", "seated", "expired", "cancelled"),
        allowNull: false,
        defaultValue: "waiting",
      },
      seatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("waitlist", ["status"]);
    await queryInterface.addIndex("waitlist", ["desiredTime"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("waitlist");
  },
};
