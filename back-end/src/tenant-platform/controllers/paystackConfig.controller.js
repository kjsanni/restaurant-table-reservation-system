const paystackConfigDAO = require("../DAOs/paystackConfig.dao");

const paystackConfigController = {};

paystackConfigController.getConfigHandler = async (req, res) => {
  const data = await paystackConfigDAO.getConfig();
  res.status(200).json({ success: true, item: data });
};

paystackConfigController.rotateKeyHandler = async (req, res) => {
  const { newSecretKey, newWebhookSecret } = req.body;
  if (!newSecretKey) {
    return res.status(400).json({ success: false, message: "newSecretKey is required" });
  }

  const current = await paystackConfigDAO.getConfig();
  if (!current.secretKey) {
    return res.status(400).json({ success: false, message: "No existing Paystack secret key configured" });
  }

  const updated = await paystackConfigDAO.updateConfig({
    secretKey: newSecretKey,
    previousSecretKey: current.secretKey,
    rotatedAt: new Date().toISOString(),
    ...(newWebhookSecret ? { webhookSecret: newWebhookSecret } : {}),
  });

  res.status(200).json({ success: true, item: updated.value || updated });
};

module.exports = paystackConfigController;
