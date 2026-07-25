"use strict";

const db = require("../../../db/models");

const pricingRuleDAO = {
  async findAll(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.ruleType) {
      where.ruleType = filters.ruleType;
    }
    if (filters.isActive !== undefined && filters.isActive !== "") {
      where.isActive = filters.isActive;
    }

    return db.pricingRule.findAll({
      where,
      order: [["priority", "DESC"], ["createdAt", "DESC"]],
    });
  },

  async findById(id, tenantId) {
    return db.pricingRule.findOne({
      where: { id, tenantId },
    });
  },

  async create(data, tenantId) {
    return db.pricingRule.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const rule = await db.pricingRule.findOne({ where: { id, tenantId } });
    if (!rule) return null;
    await rule.update(updates);
    return rule;
  },

  async delete(id, tenantId) {
    const rule = await db.pricingRule.findOne({ where: { id, tenantId } });
    if (!rule) return false;
    await rule.destroy();
    return true;
  },
};

module.exports = pricingRuleDAO;
