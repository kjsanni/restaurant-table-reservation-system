"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE users SET isSuperAdmin = true WHERE email = 'admin@rtrs.com' AND role = 'admin'`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE users SET isSuperAdmin = false WHERE email = 'admin@rtrs.com'`
    );
  },
};
