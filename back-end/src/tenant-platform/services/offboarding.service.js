"use strict";

const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const OffboardingService = {
  async initiateOffboarding(tenantId, initiatedBy = null) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    await platformAuditDAO.log({
      action: "tenant.offboarding_initiated",
      actorUserId: initiatedBy,
      tenantId,
      metadata: { tenantName: tenant.name },
    });

    return {
      success: true,
      message: "Offboarding initiated",
      tenantId,
      status: "pending",
    };
  },

  async exportTenantData(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const tables = await db.table.findAll({ where: { tenantId } });
    const reservations = await db.reservation.findAll({ where: { tenantId } });
    const customers = await db.customer.findAll({ where: { tenantId } });
    const staff = await db.user.findAll({ where: { tenantId } });

    const exportData = {
      tenant: { name: tenant.name, slug: tenant.slug, createdAt: tenant.createdAt },
      tables: tables.map((t) => t.toJSON()),
      reservations: reservations.map((r) => r.toJSON()),
      customers: customers.map((c) => c.toJSON()),
      staff: staff.map((s) => ({ id: s.id, username: s.username, role: s.role })),
      exportedAt: new Date().toISOString(),
    };

    return exportData;
  },

  async anonymizeTenantData(tenantId) {
    const customers = await db.customer.findAll({ where: { tenantId } });
    for (const customer of customers) {
      await customer.update({
        firstName: "Anonymized",
        lastName: "Customer",
        email: `anon-${customer.id}@example.com`,
        phone: null,
        address: null,
      });
    }
    return { success: true, anonymized: customers.length };
  },

  async deleteTenantData(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    await tenant.update({ status: "deleted", deletedAt: new Date() });

    const [results] = await db.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'tenantId' AND TABLE_SCHEMA = DATABASE()"
    );

    const allowedTables = new Set(
      (results || [])
        .map((r) => r.TABLE_NAME)
        .filter((name) => name && name !== "tenants")
    );

    for (const tableName of allowedTables) {
      await db.sequelize.query(`UPDATE ${tableName} SET tenantId = NULL WHERE tenantId = :tenantId`, { // nosemgrep: tainted-sql-string - tableName validated against INFORMATION_SCHEMA allowlist; query uses :tenantId parameter // guardrails-disable-line - tableName validated against INFORMATION_SCHEMA allowlist; query uses :tenantId parameter // codacy-suppress Semgrep_javascript.sequelize.security.audit.sequelize-raw-query.sequelize-raw-query - tableName validated against INFORMATION_SCHEMA allowlist; parameterized query
        replacements: { tenantId },
      });
    }

    return { success: true, message: "Tenant data deleted" };
  },
};

module.exports = OffboardingService;
