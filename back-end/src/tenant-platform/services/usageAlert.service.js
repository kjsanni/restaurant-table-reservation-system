"use strict";

const db = require("../../db/models");
const alertRuleDAO = require("../DAOs/alertRule.dao");
const { getEventUsage } = require("./planLimits.service");

const checkOverageAlerts = async () => {
  const tenants = await db.tenant.findAll({
    where: { status: ["active", "trialing"] },
    attributes: ["id", "name", "plan", "settings"],
  });

  const results = [];
  for (const tenant of tenants) {
    const usage = await getEventUsage(tenant.id);
    if (!usage) continue;

    const activeRules = await alertRuleDAO.findActive();
    for (const rule of activeRules) {
      const metric = rule.metric;
      if (!usage.warnings[metric] && !(usage.percentages[metric] >= 100)) continue;

      const existing = await db.alertRule.findOne({
        where: {
          metric,
          entityId: tenant.id,
          createdAt: { [db.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (existing) continue;

      await db.alertRule.create({
        name: `${rule.name} - ${tenant.name}`,
        description: rule.description,
        metric,
        condition: rule.condition,
        threshold: rule.threshold,
        channels: rule.channels,
        recipients: rule.recipients,
        isActive: true,
        entityId: tenant.id,
        entityType: "tenant_usage",
      });

      results.push({ tenantId: tenant.id, metric, usage: usage.percentages[metric] });
    }
  }

  return results;
};

const getTenantAlerts = async (tenantId) => {
  return db.alertRule.findAll({
    where: {
      entityId: tenantId,
      entityType: "tenant_usage",
    },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
};

module.exports = {
  checkOverageAlerts,
  getTenantAlerts,
};
