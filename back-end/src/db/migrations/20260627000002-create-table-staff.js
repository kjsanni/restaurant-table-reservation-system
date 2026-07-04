"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("table_staff", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tableId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Tables",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
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

    await queryInterface.addIndex("table_staff", ["tableId", "userId"], {
      unique: true,
      name: "unique_table_user",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("table_staff");
  },
};
