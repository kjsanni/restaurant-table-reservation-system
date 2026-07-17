"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TableEvents", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      tableId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Tables", key: "id" },
        onDelete: "CASCADE",
      },
      eventType: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex("TableEvents", ["tableId", "createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("TableEvents");
  },
};
