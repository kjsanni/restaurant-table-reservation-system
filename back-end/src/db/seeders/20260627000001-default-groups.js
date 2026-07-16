"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("groups", null, {});

    await queryInterface.bulkInsert("groups", [
      {
        name: "Front of House",
        description: "Hosts, servers, and reservation staff",
        permissions: JSON.stringify({
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Kitchen",
        description: "Kitchen staff with limited table management",
        permissions: JSON.stringify({
          view_reservations: true,
          edit_reservations: false,
          manage_tables: false,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Management",
        description: "Owners and managers with full access",
        permissions: JSON.stringify({
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
          manage_schedule: true,
          manage_staff: true,
          view_audit_logs: true,
          manage_audit_logs: true,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "waiting_staff",
        description: "Staff assigned to handle reserved tables",
        permissions: JSON.stringify({
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
          manage_schedule: false,
          manage_staff: false,
          view_audit_logs: false,
          manage_audit_logs: false,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("groups", null, {});
  },
};
