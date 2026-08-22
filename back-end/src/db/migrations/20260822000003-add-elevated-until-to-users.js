"use strict";

const addElevatedUntilToUsers = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn("users", "elevatedUntil", {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await queryInterface.addIndex("users", ["elevatedUntil"]);
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await addElevatedUntilToUsers(queryInterface, Sequelize);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("users", ["elevatedUntil"]);
    await queryInterface.removeColumn("users", "elevatedUntil");
  },
};
