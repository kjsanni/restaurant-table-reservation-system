const response = require("../utils/response");

const db = require("../../db/models");

const extendTrialHandler = async (req, res) => {
  const { days } = req.body;
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  if (tenant.status !== "trialing") {
    return response.badRequest(res, "Only trialing tenants can have their trial extended");
  }
  const extendTo = new Date(tenant.trialExtendsTo || Date.now());
  extendTo.setDate(extendTo.getDate() + (days || 7));
  await tenant.update({ trialExtendsTo: extendTo });
  res.status(200).json({ success: true, item: tenant });
};

const convertTrialHandler = async (req, res) => {
  if (!req.user?.permissions?.manage_billing) {
    return response.forbidden(res, "Billing permission required to convert trial");
  }
  const { plan, billingEmail, billingName } = req.body;
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  if (tenant.status !== "trialing") {
    return response.badRequest(res, "Only trialing tenants can be converted");
  }
  await tenant.update({
    status: "active",
    subscriptionStatus: "active",
    plan: plan || tenant.plan,
    billingEmail: billingEmail || tenant.billingEmail,
    billingName: billingName || tenant.billingName,
    convertedFromTrialAt: new Date(),
    trialExtendsTo: null,
  });
  res.status(200).json({ success: true, item: tenant });
};

module.exports = {
  extendTrialHandler,
  convertTrialHandler,
};
