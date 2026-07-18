"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, permissions FROM roles WHERE name = 'admin' LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return;
    }

    const role = rows[0];
    const permissions = typeof role.permissions === "string" ? JSON.parse(role.permissions) : role.permissions;

    if (!permissions.manage_tenants) {
      permissions.manage_tenants = true;
      await queryInterface.sequelize.query(
        `UPDATE roles SET permissions = :permissions WHERE id = :id`,
        {
          replacements: {
            permissions: JSON.stringify(permissions),
            id: role.id,
          },
        }
      );
    }
  },

  async down() {
    await queryInterface.sequelize.query(
      `UPDATE roles SET permissions = JSON_REMOVE(permissions, '$.manage_tenants') WHERE name = 'admin'`
    );
  },
};
