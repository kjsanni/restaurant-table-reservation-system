"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE isSuperAdmin = true",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const user of users) {
      await queryInterface.sequelize.query(
        "UPDATE users SET platformRoles = :roles WHERE id = :id",
        {
          replacements: {
            roles: JSON.stringify(["platform_admin"]),
            id: user.id,
          },
        }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE users SET platformRoles = NULL WHERE platformRoles IS NOT NULL"
    );
  },
};
