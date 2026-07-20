const db = require("../../db/models");
const planDAO = require("../DAOs/plan.dao");
const { invalidatePlansCache } = require("../services/tenantSubscription.service");

const listPlansHandler = async (req, res) => {
  const { isActive } = req.query;
  const plans = await planDAO.findAll({
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, collection: plans });
};

const getPlanHandler = async (req, res) => {
  const plan = await planDAO.findById(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: "Plan not found" });
  }
  res.status(200).json({ success: true, item: plan });
};

const createPlanHandler = async (req, res) => {
  const allowed = ["name", "slug", "price", "currency", "maxTables", "maxReservationsPerMonth", "isActive", "sortOrder"];
  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }

  if (!data.name || !data.slug) {
    return res.status(400).json({ success: false, message: "Name and slug are required" });
  }

  const existing = await planDAO.findBySlug(data.slug);
  if (existing) {
    return res.status(409).json({ success: false, message: "A plan with this slug already exists" });
  }

  const plan = await planDAO.create(data);
  invalidatePlansCache();
  res.status(201).json({ success: true, item: plan });
};

const updatePlanHandler = async (req, res) => {
  const plan = await planDAO.findById(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: "Plan not found" });
  }

  const allowed = ["name", "slug", "price", "currency", "maxTables", "maxReservationsPerMonth", "isActive", "sortOrder"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  if (updates.slug) {
    const existing = await planDAO.findBySlug(updates.slug);
    if (existing && existing.id !== plan.id) {
      return res.status(409).json({ success: false, message: "A plan with this slug already exists" });
    }
  }

  const updated = await planDAO.update(req.params.id, updates);
  invalidatePlansCache();
  res.status(200).json({ success: true, item: updated });
};

const deletePlanHandler = async (req, res) => {
  const plan = await planDAO.findById(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: "Plan not found" });
  }

  const tenantCount = await db.tenant.count({ where: { plan: plan.slug } });
  if (tenantCount > 0) {
    return res.status(409).json({
      success: false,
      message: `Cannot delete plan: ${tenantCount} tenant(s) are using it`,
    });
  }

  await planDAO.remove(req.params.id);
  invalidatePlansCache();
  res.status(200).json({ success: true, message: "Plan deleted" });
};

module.exports = {
  listPlansHandler,
  getPlanHandler,
  createPlanHandler,
  updatePlanHandler,
  deletePlanHandler,
};
