"use strict";
const { Model } = require("sequelize");

const getTenantMigrationStatusAttributes = (DataTypes) => ({
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  migrationName: { type: DataTypes.STRING(255), allowNull: false },
  status: {
    type: DataTypes.ENUM("pending", "running", "completed", "failed", "paused", "rolled_back"),
    allowNull: false,
    defaultValue: "pending",
  },
  startedAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  error: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
  rolledBackBy: { type: DataTypes.INTEGER, allowNull: true },
  rolledBackAt: { type: DataTypes.DATE, allowNull: true },
});

module.exports = (sequelize, DataTypes) => {
  class TenantMigrationStatus extends Model {
    static associate(models) {
      TenantMigrationStatus.belongsTo(models.tenant, {
        foreignKey: "tenantId",
        as: "tenant",
      });
    }
  }

  TenantMigrationStatus.init(getTenantMigrationStatusAttributes(DataTypes), {
    sequelize,
    modelName: "tenantMigrationStatus",
    tableName: "tenant_migration_status",
    indexes: [
      { fields: ["tenantId", "migrationName"], unique: true, name: "uniq_tenant_migration" },
      { fields: ["status"], name: "idx_tenant_migration_status" },
      { fields: ["tenantId"], name: "idx_tenant_migration_tenant" },
    ],
  });

  return TenantMigrationStatus;
};
