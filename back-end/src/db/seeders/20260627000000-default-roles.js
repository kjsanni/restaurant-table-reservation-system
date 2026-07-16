"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", null, {});

    await queryInterface.bulkInsert("roles", [
      {
        name: "admin",
        description: "Full system access",
        permissions: JSON.stringify({
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
          manage_schedule: true,
          manage_staff: true,
          manage_roles: true,
          manage_groups: true,
          view_audit_logs: true,
          manage_audit_logs: true,
        }),
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "manager",
        description: "Manage reservations and tables",
        permissions: JSON.stringify({
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
          manage_schedule: true,
          manage_staff: false,
          manage_roles: false,
          manage_groups: false,
          view_audit_logs: true,
          manage_audit_logs: true,
        }),
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "staff",
        description: "Basic access to view and edit reservations",
        permissions: JSON.stringify({
          view_reservations: true,
          edit_reservations: true,
          manage_tables: false,
          manage_schedule: false,
          manage_staff: false,
          manage_roles: false,
          manage_groups: false,
          view_audit_logs: false,
          manage_audit_logs: false,
        }),
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};
