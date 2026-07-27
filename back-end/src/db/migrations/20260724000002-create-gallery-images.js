"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("gallery_images", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      appointmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      url: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      caption: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("gallery_images", ["tenantId", "isPublic"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("gallery_images");
  },
};
