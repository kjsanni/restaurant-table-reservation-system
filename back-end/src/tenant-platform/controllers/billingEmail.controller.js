const bulkDAO = require("../DAOs/bulk.dao");

const sendPaymentReminderHandler = async (req, res) => {
  const { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    return res.status(400).json({ success: false, message: "tenantIds array is required" });
  }
  const results = await bulkDAO.sendEmail(tenantIds, "Payment Reminder", "Your payment is due. Please update your billing.");
  res.status(200).json({ success: true, results });
};

const sendSuspensionNoticeHandler = async (req, res) => {
  const { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    return res.status(400).json({ success: false, message: "tenantIds array is required" });
  }
  const results = await bulkDAO.sendEmail(tenantIds, "Account Suspension Notice", "Your account has been suspended due to payment issues.");
  res.status(200).json({ success: true, results });
};

const sendTrialExpiryHandler = async (req, res) => {
  const { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    return res.status(400).json({ success: false, message: "tenantIds array is required" });
  }
  const results = await bulkDAO.sendEmail(tenantIds, "Trial Expiring Soon", "Your trial period is ending soon. Please subscribe to continue.");
  res.status(200).json({ success: true, results });
};

module.exports = {
  sendPaymentReminderHandler,
  sendSuspensionNoticeHandler,
  sendTrialExpiryHandler,
};
