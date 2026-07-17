"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = [
      "Users",
      "Customers",
      "Reservations",
      "Tables",
      "Payments",
      "Waitlist",
      "AuditLogs",
      "Settings",
      "Schedule",
      "Holidays",
      "ReservationStatusHistory",
      "Refunds",
      "EmailTemplates",
      "PermissionTemplates",
      "Shifts",
      "TimeOffs",
      "TableEvents",
      "FloorPlans",
    ];

    for (const table of tables) {
      try {
        await queryInterface.addColumn(table, "tenantId", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "tenants", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
        await queryInterface.addIndex(table, ["tenantId"]);
      } catch (err) {
        if (err.message.includes("column name \"tenantId\" already exists")) {
          console.log(`Column tenantId already exists on ${table}`);
        } else {
          throw err;
        }
      }
    }

    const junctionTables = [
      { table: "user_groups", col: "userId" },
      { table: "table_staff", col: "userId" },
      { table: "reservation_staff", col: "userId" },
      { table: "role_permissions", col: "roleId" },
    ];

    for (const jt of junctionTables) {
      try {
        await queryInterface.addColumn(jt.table, "tenantId", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "tenants", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
        await queryInterface.addIndex(jt.table, ["tenantId"]);
      } catch (err) {
        if (err.message.includes("column name \"tenantId\" already exists")) {
          console.log(`Column tenantId already exists on ${jt.table}`);
        } else {
          throw err;
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = [
      "Users",
      "Customers",
      "Reservations",
      "Tables",
      "Payments",
      "Waitlist",
      "AuditLogs",
      "Settings",
      "Schedule",
      "Holidays",
      "ReservationStatusHistory",
      "Refunds",
      "EmailTemplates",
      "PermissionTemplates",
      "Shifts",
      "TimeOffs",
      "TableEvents",
      "FloorPlans",
      "user_groups",
      "table_staff",
      "reservation_staff",
      "role_permissions",
    ];

    for (const table of tables) {
      try {
        await queryInterface.removeColumn(table, "tenantId");
      } catch (err) {
        console.log(`Skip removing tenantId from ${table}: ${err.message}`);
      }
    }
  },
};
