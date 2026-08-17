const paystackConfigDAO = require("../DAOs/paystackConfig.dao");
const paystackService = require("../services/paystack.service");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const paystackConfigController = {};

paystackConfigController.getConfigHandler = async (req, res) => {
  const data = await paystackConfigDAO.getConfig();
  res.status(200).json({
    success: true,
    config: {
      mode: data.mode || "test",
      hasSecretKey: Boolean(data.secretKey),
      hasWebhookSecret: Boolean(data.webhookSecret),
    },
  });
};

paystackConfigController.rotateKeyHandler = async (req, res) => {
  const { secretKey, webhookSecret, mode } = req.body;
  if (!secretKey) {
    return res.status(400).json({ success: false, message: "secretKey is required" });
  }

  const current = await paystackConfigDAO.getConfig();
  if (!current.secretKey) {
    return res.status(400).json({ success: false, message: "No existing Paystack secret key configured" });
  }

  const isValid = await paystackService.validateSecretKey(secretKey);
  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid Paystack secret key" });
  }

  const updated = await paystackConfigDAO.updateConfig({
    secretKey,
    previousSecretKey: current.secretKey,
    rotatedAt: new Date().toISOString(),
    ...(webhookSecret ? { webhookSecret } : {}),
    ...(mode ? { mode } : {}),
  });

await auditLog(req, "platform.paystack_keys_rotated", "setting", null, {
      mode: updated.value?.mode || updated.mode || "test",
      hasSecretKey: Boolean(updated.value?.secretKey || updated.secretKey),
      hasWebhookSecret: Boolean(updated.value?.webhookSecret || updated.webhookSecret),
    });

  res.status(200).json({
    success: true,
    message: "Paystack keys rotated successfully",
    config: {
      mode: updated.value?.mode || updated.mode || "test",
      hasSecretKey: Boolean(updated.value?.secretKey || updated.secretKey),
      hasWebhookSecret: Boolean(updated.value?.webhookSecret || updated.webhookSecret),
    },
  });
};

module.exports = paystackConfigController;
