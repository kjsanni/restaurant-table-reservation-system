"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addTenantIdIfMissing = async (table) => {
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
        if (
          err.message.includes("tenantId") &&
          (err.message.includes("already exists") || err.message.includes("Duplicate column"))
        ) {
          console.log(`Column tenantId already exists on ${table}`);
        } else {
          throw err;
        }
      }
    };

    await addTenantIdIfMissing("groups");
    await addTenantIdIfMissing("roles");

    const dropIfExists = async (table, indexName) => {
      try {
        await queryInterface.sequelize.query(`DROP INDEX \`${indexName}\` ON \`${table}\``);
      } catch (err) {
        if (!err.message.includes("check that column/key exists")) {
          throw err;
        }
      }
    };

    await dropIfExists("users", "users_tenant_id_email");
    await dropIfExists("users", "users_tenant_id_username");
    await dropIfExists("Customers", "customers_tenant_id_email");
    await dropIfExists("Tables", "tables_tenant_id_name");
    await dropIfExists("holidays", "holidays_tenant_id_date");
    await dropIfExists("settings", "settings_tenant_id_key");
    await dropIfExists("emailTemplates", "email_templates_tenant_id_key");
    await dropIfExists("groups", "groups_tenant_id_name");
    await dropIfExists("roles", "roles_tenant_id_name");

    await queryInterface.addIndex("users", ["tenantId", "email"], { unique: true });
    await queryInterface.addIndex("users", ["tenantId", "username"], { unique: true });
    await queryInterface.addIndex("Customers", ["tenantId", "email"], { unique: true });
    await queryInterface.addIndex("Tables", ["tenantId", "name"], { unique: true });
    await queryInterface.addIndex("holidays", ["tenantId", "date"], { unique: true });
    await queryInterface.addIndex("settings", ["tenantId", "key"], { unique: true });
    await queryInterface.addIndex("emailTemplates", ["tenantId", "key"], { unique: true });
    await queryInterface.addIndex("groups", ["tenantId", "name"], { unique: true });
    await queryInterface.addIndex("roles", ["tenantId", "name"], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("users", ["tenantId", "email"]);
    await queryInterface.removeIndex("users", ["tenantId", "username"]);
    await queryInterface.removeIndex("Customers", ["tenantId", "email"]);
    await queryInterface.removeIndex("Tables", ["tenantId", "name"]);
    await queryInterface.removeIndex("holidays", ["tenantId", "date"]);
    await queryInterface.removeIndex("settings", ["tenantId", "key"]);
    await queryInterface.removeIndex("emailTemplates", ["tenantId", "key"]);
    await queryInterface.removeIndex("groups", ["tenantId", "name"]);
    await queryInterface.removeIndex("roles", ["tenantId", "name"]);

    await queryInterface.sequelize.query("CREATE UNIQUE INDEX `key` ON Settings (`key`)");
    await queryInterface.sequelize.query("CREATE UNIQUE INDEX `key` ON emailTemplates (`key`)");
    await queryInterface.sequelize.query("CREATE UNIQUE INDEX name ON `Groups` (name)");
    await queryInterface.sequelize.query("CREATE UNIQUE INDEX name ON Roles (name)");
    await queryInterface.sequelize.query("CREATE UNIQUE INDEX date ON Holidays (date)");
    await queryInterface.sequelize.query("CREATE UNIQUE INDEX email ON Users (email)");
    await queryInterface.sequelize.query("CREATE UNIQUE INDEX username ON Users (username)");
  },
};
