const paystackService = require("../services/paystack.service");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const rotatePaystackKeysHandler = async (req, res) => {
  const { secretKey, webhookSecret, mode } = req.body;

  if (!secretKey) {
    return res.status(400).json({ success: false, message: "Secret key is required" });
  }

  const isValid = await paystackService.validateSecretKey(secretKey);
  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid Paystack secret key" });
  }

  const updated = await paystackService.updatePlatformPaystackConfig({
    secretKey,
    webhookSecret: webhookSecret || undefined,
    mode: mode || undefined,
  });

await auditLog(req, "platform.paystack_keys_rotated", "setting", null, {
      mode: updated.mode,
      hasSecretKey: Boolean(updated.secretKey),
      hasWebhookSecret: Boolean(updated.webhookSecret),
    });

  res.status(200).json({
    success: true,
    message: "Paystack keys rotated successfully",
    config: {
      mode: updated.mode,
      hasSecretKey: Boolean(updated.secretKey),
      hasWebhookSecret: Boolean(updated.webhookSecret),
    },
  });
};

const getPaystackConfigStatusHandler = async (req, res) => {
  const config = await paystackService.loadPaystackConfig();
  res.status(200).json({
    success: true,
    config: {
      mode: config.mode,
      hasSecretKey: Boolean(config.secretKey),
      hasWebhookSecret: Boolean(config.webhookSecret),
    },
  });
};

module.exports = {
  rotatePaystackKeysHandler,
  getPaystackConfigStatusHandler,
};
