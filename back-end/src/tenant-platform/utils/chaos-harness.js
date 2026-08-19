"use strict";

const db = require("../../db/models");

const ChaosHarness = {
  async simulateTenantDeletion(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      return { success: false, message: "Tenant not found" };
    }

    const backup = await tenant.get({ plain: true });

    await tenant.update({ status: "deleted", deletedAt: new Date() });

    const dependentRecords = await db.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'tenantId' AND TABLE_SCHEMA = DATABASE()"
    );

    const knownTables = new Set([
      "reservations", "payments", "customers", "orders", "reviews", "waitlist",
      "tables", "floorPlans", "menuItems", "promotions", "deliveries", "whatsappMessages",
      "salon_appointments", "salon_stations", "salon_services", "salon_gift_cards",
      "salon_referrals", "salon_locations", "salon_inventory", "salon_expenses",
      "salon_pricing_rules", "salon_commissions", "salon_gallery", "salon_staff",
      "salon_marketing_campaigns", "salon_recurring_appointments", "salon_client_segments",
      "salon_inventory_transfers", "salon_staff_location_assignments",
      "event_bookings", "event_guest_lists", "event_ticket_types", "event_qr_codes",
      "event_web_passes", "event_wallet_pass_requests", "event_photos"
    ]);

    const results = [];
    for (const row of dependentRecords) {
      const tableName = row.TABLE_NAME;
      if (!knownTables.has(tableName)) continue;
      try {
        const [affected] = await db.sequelize.query(["UPDATE", tableName, "SET tenantId = NULL WHERE tenantId = :tenantId"].join(" "), {
          replacements: { tenantId } }
        );
        results.push({ table: tableName, affected: affected.affectedRows || 0 });
      } catch (err) {
        results.push({ table: tableName, error: err.message });
      }
    }

    return {
      success: true,
      message: "Tenant deletion simulated",
      tenant: backup,
      dependentUpdates: results,
    };
  },

  async simulateDatabaseFailover() {
    try {
      await db.sequelize.authenticate();
      return { success: true, message: "Database connection healthy", failover: false };
    } catch (err) {
      return {
        success: false,
        message: "Database connection failed",
        error: err.message,
        failover: true,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getTenantIsolationStatus(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      return { success: false, message: "Tenant not found" };
    }

    const dependentRecords = await db.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'tenantId' AND TABLE_SCHEMA = DATABASE()"
    );

    const leakageChecks = [];
    for (const row of dependentRecords) {
      const tableName = row.TABLE_NAME;
      if (!knownTables.has(tableName)) continue;
      try {
        const [crossTenantRows] = await db.sequelize.query(["SELECT COUNT(*) as count FROM", tableName, "WHERE tenantId != :tenantId AND tenantId IS NOT NULL"].join(" "), {
          replacements: { tenantId } }
        );
        leakageChecks.push({
          table: tableName,
          crossTenantRowCount: crossTenantRows[0]?.count || 0,
        });
      } catch (err) {
        leakageChecks.push({ table: tableName, error: err.message });
      }
    }

    return {
      success: true,
      tenantId,
      tenantStatus: tenant.status,
      isolationChecks: leakageChecks,
      hasLeakage: leakageChecks.some((c) => c.crossTenantRowCount > 0),
    };
  },
};

module.exports = ChaosHarness;
