"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("sub_processors", "sub_processors_status");

    await queryInterface.removeColumn("sub_processors", "location");
    await queryInterface.removeColumn("sub_processors", "status");
    await queryInterface.removeColumn("sub_processors", "dpaUrl");
    await queryInterface.removeColumn("sub_processors", "privacyPolicyUrl");

    await queryInterface.addColumn("sub_processors", "category", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("sub_processors", "country", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("sub_processors", "isActive", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.changeColumn("sub_processors", "purpose", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addIndex("sub_processors", ["category"]);
    await queryInterface.addIndex("sub_processors", ["isActive"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("sub_processors", ["isActive"]);
    await queryInterface.removeIndex("sub_processors", ["category"]);

    await queryInterface.removeColumn("sub_processors", "isActive");
    await queryInterface.removeColumn("sub_processors", "country");
    await queryInterface.removeColumn("sub_processors", "category");

    await queryInterface.addColumn("sub_processors", "location", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("sub_processors", "status", {
      type: Sequelize.ENUM("active", "inactive", "under_review"),
      allowNull: false,
      defaultValue: "active",
    });

    await queryInterface.addColumn("sub_processors", "dpaUrl", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn("sub_processors", "privacyPolicyUrl", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.changeColumn("sub_processors", "purpose", {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    await queryInterface.addIndex("sub_processors", ["status"]);
  },
};
