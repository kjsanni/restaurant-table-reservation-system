const bulkDAO = require("../DAOs/bulk.dao");
const db = require("../../db/models");

const sendPaymentReminderHandler = async (req, res) => {
  let { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    const tenants = await db.tenant.findAll({ attributes: ["id"] });
    tenantIds = tenants.map((t) => t.id);
  }
  const results = await bulkDAO.sendEmail(tenantIds, "Payment Reminder", "Your payment is due. Please update your billing.");
  res.status(200).json({ success: true, results, sentCount: results.filter((r) => r.sent).length });
};

const sendSuspensionNoticeHandler = async (req, res) => {
  let { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    const tenants = await db.tenant.findAll({ attributes: ["id"] });
    tenantIds = tenants.map((t) => t.id);
  }
  const results = await bulkDAO.sendEmail(tenantIds, "Account Suspension Notice", "Your account has been suspended due to payment issues.");
  res.status(200).json({ success: true, results, sentCount: results.filter((r) => r.sent).length });
};

const sendTrialExpiryHandler = async (req, res) => {
  let { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    const tenants = await db.tenant.findAll({ attributes: ["id"] });
    tenantIds = tenants.map((t) => t.id);
  }
  const results = await bulkDAO.sendEmail(tenantIds, "Trial Expiring Soon", "Your trial period is ending soon. Please subscribe to continue.");
  res.status(200).json({ success: true, results, sentCount: results.filter((r) => r.sent).length });
};

module.exports = {
  sendPaymentReminderHandler,
  sendSuspensionNoticeHandler,
  sendTrialExpiryHandler,
};
