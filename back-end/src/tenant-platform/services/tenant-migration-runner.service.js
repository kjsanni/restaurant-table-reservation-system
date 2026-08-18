"use strict";

const db = require("../../db/models");
const TenantMigrationStatus = db.tenantMigrationStatus;
const { QueryTypes } = require("sequelize");

const TenantMigrationRunner = {
  async getMigrationsForTenant(tenantId) {
    const [applied] = await db.sequelize.query("SELECT name FROM SequelizeMeta ORDER BY name ASC");
    const appliedNames = (applied || []).map((row) => row.name);

    const fs = require("fs");
    const path = require("path");
    const migrationsDir = path.join(process.cwd(), "src", "db", "migrations");
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".js")).sort();

    const statuses = await TenantMigrationStatus.findAll({ where: { tenantId } });
    const statusMap = {};
    statuses.forEach((s) => { statusMap[s.migrationName] = s; });

    return files.map((file) => {
      const existing = statusMap[file];
      const isApplied = appliedNames.includes(file);
      return {
        name: file,
        globalStatus: isApplied ? "applied" : "pending",
        tenantStatus: existing ? existing.status : (isApplied ? "completed" : "pending"),
        startedAt: existing ? existing.startedAt : null,
        completedAt: existing ? existing.completedAt : null,
        error: existing ? existing.error : null,
      };
    });
  },

  async runMigrationForTenant(tenantId, migrationName, userId = null) {
    const [status] = await TenantMigrationStatus.findOrCreate({
      where: { tenantId, migrationName },
      defaults: { status: "pending", metadata: {} },
    });

    if (status.status === "completed") {
      return { success: true, message: "Migration already completed", status };
    }

    if (status.status === "running") {
      return { success: false, message: "Migration is already running", status };
    }

    await TenantMigrationStatus.update({ status: "running", startedAt: new Date() }, { where: { id: status.id } });

    try {
      const migrationPath = require("path").join(process.cwd(), "src", "db", "migrations", migrationName);
      const migration = require(migrationPath);
      if (migration.up && typeof migration.up === "function") {
        await migration.up(db.sequelize.getQueryInterface(), db.sequelize.constructor);
      }

      await TenantMigrationStatus.update(
        { status: "completed", completedAt: new Date(), error: null },
        { where: { id: status.id } }
      );

      return { success: true, message: "Migration completed", status: await TenantMigrationStatus.findByPk(status.id) };
    } catch (err) {
      await TenantMigrationStatus.update(
        { status: "failed", error: err.message },
        { where: { id: status.id } }
      );
      return { success: false, message: err.message };
    }
  },

  async pauseMigration(tenantId, migrationName) {
    const status = await TenantMigrationStatus.findOne({ where: { tenantId, migrationName } });
    if (!status || status.status !== "running") {
      return { success: false, message: "Migration is not running" };
    }
    await TenantMigrationStatus.update({ status: "paused" }, { where: { id: status.id } });
    return { success: true, message: "Migration paused" };
  },

  async resumeMigration(tenantId, migrationName) {
    const status = await TenantMigrationStatus.findOne({ where: { tenantId, migrationName } });
    if (!status || status.status !== "paused") {
      return { success: false, message: "Migration is not paused" };
    }
    await TenantMigrationStatus.update({ status: "running" }, { where: { id: status.id } });
    return { success: true, message: "Migration resumed" };
  },

  async rollbackMigration(tenantId, migrationName, userId = null) {
    const status = await TenantMigrationStatus.findOne({ where: { tenantId, migrationName } });
    if (!status || status.status !== "completed") {
      return { success: false, message: "Migration is not completed" };
    }

    try {
      const migrationPath = require("path").join(process.cwd(), "src", "db", "migrations", migrationName);
      const migration = require(migrationPath);
      if (migration.down && typeof migration.down === "function") {
        await migration.down(db.sequelize.getQueryInterface(), db.sequelize.constructor);
      }

      await TenantMigrationStatus.update(
        { status: "rolled_back", rolledBackBy: userId, rolledBackAt: new Date() },
        { where: { id: status.id } }
      );

      return { success: true, message: "Migration rolled back" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
};

module.exports = TenantMigrationRunner;
