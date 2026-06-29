"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("login_attempts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      attemptedAt: {
        allowNull: false,
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("login_attempts", ["email", "attemptedAt"], {
      name: "idx_email_attempted",
    });

    await queryInterface.addIndex("login_attempts", ["ipAddress", "attemptedAt"], {
      name: "idx_ip_attempted",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("login_attempts");
  },
};
