"use strict";

const createVerticalConfigurationsTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("vertical_configurations", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vertical: {
      type: Sequelize.ENUM("restaurant", "salon", "event"),
      allowNull: false,
    },
    useCaseType: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    featureFlags: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    },
    serviceModes: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    },
    allowedIntegrations: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    },
    uiComponents: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    },
    breakglassRequired: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
};

const addVerticalConfigurationsIndexes = async (queryInterface) => {
  await queryInterface.addIndex("vertical_configurations", ["vertical", "useCaseType"], {
    unique: true,
    name: "uniq_vertical_usecase",
  });
  await queryInterface.addIndex("vertical_configurations", ["vertical"]);
  await queryInterface.addIndex("vertical_configurations", ["isActive"]);
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await createVerticalConfigurationsTable(queryInterface, Sequelize);
    await addVerticalConfigurationsIndexes(queryInterface);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("vertical_configurations");
  },
};
