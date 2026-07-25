"use strict";

const pricingRuleDao = require("../DAOs/pricingRule.dao");

const createPricingRuleHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body;
    const rule = await pricingRuleDao.create(data, tenantId);
    return res.status(201).json({ success: true, data: rule });
  } catch (err) {
    console.error("createPricingRuleHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create pricing rule" });
  }
};

const getPricingRulesHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { ruleType, isActive } = req.query;
    const rules = await pricingRuleDao.findAll(tenantId, { ruleType, isActive });
    return res.status(200).json({ success: true, data: rules });
  } catch (err) {
    console.error("getPricingRulesHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load pricing rules" });
  }
};

const getPricingRuleHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const rule = await pricingRuleDao.findById(id, tenantId);
    if (!rule) {
      return res.status(404).json({ success: false, message: "Pricing rule not found" });
    }
    return res.status(200).json({ success: true, data: rule });
  } catch (err) {
    console.error("getPricingRuleHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load pricing rule" });
  }
};

const updatePricingRuleHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await pricingRuleDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Pricing rule not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updatePricingRuleHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update pricing rule" });
  }
};

const deletePricingRuleHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await pricingRuleDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Pricing rule not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deletePricingRuleHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete pricing rule" });
  }
};

module.exports = {
  createPricingRuleHandler,
  getPricingRulesHandler,
  getPricingRuleHandler,
  updatePricingRuleHandler,
  deletePricingRuleHandler,
};
