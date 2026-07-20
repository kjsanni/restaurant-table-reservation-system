const db = require("../../db/models");

const getGracePeriodHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  const plan = await db.subscriptionPlan.findOne({ where: { slug: tenant.plan } });
  const globalGrace = await db.setting.findOne({ where: { key: "default_grace_period_days" } });
  const globalDays = globalGrace ? parseInt(globalGrace.value, 10) : 7;
  const planDays = plan ? plan.gracePeriodDays : globalDays;
  res.status(200).json({ success: true, tenantGraceDays: planDays, globalGraceDays: globalDays });
};

const updateGracePeriodHandler = async (req, res) => {
  const { days } = req.body;
  if (typeof days !== "number" || days < 0) {
    return res.status(400).json({ success: false, message: "Valid grace period days is required" });
  }
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  const plan = await db.subscriptionPlan.findOne({ where: { slug: tenant.plan } });
  if (plan) {
    await plan.update({ gracePeriodDays: days });
  }
  res.status(200).json({ success: true, gracePeriodDays: days });
};

module.exports = {
  getGracePeriodHandler,
  updateGracePeriodHandler,
};
