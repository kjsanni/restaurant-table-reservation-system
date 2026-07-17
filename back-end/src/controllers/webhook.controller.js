const webhookService = require("../services/webhook.service");

const listSubscriptionsHandler = async (req, res) => {
  const config = await require("../DAOs/auth.dao").getSettingValue(
    "webhooks",
    { enabled: false, subscriptions: [] },
    req.tenant?.id
  );
  return res.status(200).json({ success: true, webhooks: config });
};

const updateSubscriptionsHandler = async (req, res) => {
  const { subscriptions } = req.body;
  if (!Array.isArray(subscriptions)) {
    return res.status(400).json({ success: false, message: "subscriptions must be an array" });
  }
  const authDAO = require("../DAOs/auth.dao");
  const updated = await authDAO.updateSettings(
    "webhooks",
    { enabled: true, subscriptions }
  );
  return res.status(200).json({ success: true, webhooks: updated });
};

const testHandler = async (req, res) => {
  const { url, event } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: "url is required" });
  }
  await webhookService.dispatch(event || "test", { message: "webhook test payload" }, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Test webhook dispatched" });
};

module.exports = {
  listSubscriptionsHandler,
  updateSubscriptionsHandler,
  testHandler,
};
