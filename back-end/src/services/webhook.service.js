const axios = require("axios");
const authDAO = require("../DAOs/auth.dao");
const { validateWebhookUrl } = require("../tenant-platform/services/webhookNotification.service");

const dispatch = async (event, payload, tenantId) => {
  try {
    const config = await authDAO.getSettingValue(
      "webhooks",
      { enabled: false, subscriptions: [] },
      tenantId
    );
    if (!config || !config.enabled) return;
    const subs = Array.isArray(config.subscriptions) ? config.subscriptions : [];
    const active = subs.filter((s) => s.active && Array.isArray(s.events) && s.events.includes(event));
    if (!active.length) return;

    const results = await Promise.allSettled(
      active.map(async (sub) => {
        try {
          await validateWebhookUrl(sub.url);
        } catch (err) {
          console.error(`Webhook URL validation failed for ${sub.url}:`, err.message);
          throw err;
        }
        return axios.post(sub.url, { event, payload, timestamp: new Date().toISOString() }, { timeout: 5000 });
      })
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const err = result.reason;
        if (err && err.code !== "ECONNABORTED") {
          console.error(`Webhook delivery failed to ${active[index].url}:`, err.message);
        }
      }
    });
  } catch (err) {
    console.error("Webhook dispatch error:", err.message);
  }
};

module.exports = {
  dispatch,
};
