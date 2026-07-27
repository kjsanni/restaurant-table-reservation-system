"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn("tenants", "secondaryColor", {
      type: DataTypes.STRING({
        length: 20,
      }),
      allowNull: true,
      after: "primaryColor",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tenants", "secondaryColor");
  },
};
