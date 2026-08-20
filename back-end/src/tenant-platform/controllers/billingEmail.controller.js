const bulkDAO = require("../DAOs/bulk.dao");
const db = require("../../db/models");

const MAX_EMAIL_BATCH = 100;

const sendBulkEmail = async (tenantIds, subject, body) => {
  const results = [];
  for (let i = 0; i < tenantIds.length; i += MAX_EMAIL_BATCH) {
    const chunk = tenantIds.slice(i, i + MAX_EMAIL_BATCH);
    const chunkResults = await bulkDAO.sendEmail(chunk, subject, body);
    results.push(...chunkResults);
  }
  return results;
};

const sendPaymentReminderHandler = async (req, res) => {
  let { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    const total = await db.tenant.count();
    if (total > MAX_EMAIL_BATCH) {
      return res.status(400).json({ success: false, message: "Too many tenants. Please specify tenant IDs or use the batch email endpoint." });
    }
    const tenants = await db.tenant.findAll({ attributes: ["id"] });
    tenantIds = tenants.map((t) => t.id);
  }
  if (tenantIds.length > MAX_EMAIL_BATCH) {
    return res.status(400).json({ success: false, message: "Too many tenants. Please specify tenant IDs or use the batch email endpoint." });
  }
  const results = await sendBulkEmail(tenantIds, "Payment Reminder", "Your payment is due. Please update your billing.");
  res.status(200).json({ success: true, results, sentCount: results.filter((r) => r.sent).length });
};

const sendSuspensionNoticeHandler = async (req, res) => {
  let { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    const total = await db.tenant.count();
    if (total > MAX_EMAIL_BATCH) {
      return res.status(400).json({ success: false, message: "Too many tenants. Please specify tenant IDs or use the batch email endpoint." });
    }
    const tenants = await db.tenant.findAll({ attributes: ["id"] });
    tenantIds = tenants.map((t) => t.id);
  }
  if (tenantIds.length > MAX_EMAIL_BATCH) {
    return res.status(400).json({ success: false, message: "Too many tenants. Please specify tenant IDs or use the batch email endpoint." });
  }
  const results = await sendBulkEmail(tenantIds, "Account Suspension Notice", "Your account has been suspended due to payment issues.");
  res.status(200).json({ success: true, results, sentCount: results.filter((r) => r.sent).length });
};

const sendTrialExpiryHandler = async (req, res) => {
  let { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    const total = await db.tenant.count();
    if (total > MAX_EMAIL_BATCH) {
      return res.status(400).json({ success: false, message: "Too many tenants. Please specify tenant IDs or use the batch email endpoint." });
    }
    const tenants = await db.tenant.findAll({ attributes: ["id"] });
    tenantIds = tenants.map((t) => t.id);
  }
  if (tenantIds.length > MAX_EMAIL_BATCH) {
    return res.status(400).json({ success: false, message: "Too many tenants. Please specify tenant IDs or use the batch email endpoint." });
  }
  const results = await sendBulkEmail(tenantIds, "Trial Expiring Soon", "Your trial period is ending soon. Please subscribe to continue.");
  res.status(200).json({ success: true, results, sentCount: results.filter((r) => r.sent).length });
};

module.exports = {
  sendPaymentReminderHandler,
  sendSuspensionNoticeHandler,
  sendTrialExpiryHandler,
};
