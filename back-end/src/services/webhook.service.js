const axios = require("axios");
const authDAO = require("../DAOs/auth.dao");

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

    await Promise.allSettled(
      active.map((sub) =>
        axios
          .post(sub.url, { event, payload, timestamp: new Date().toISOString() }, { timeout: 5000 })
          .catch((err) => {
            if (err && err.code !== "ECONNABORTED") {
              console.error(`Webhook delivery failed to ${sub.url}:`, err.message);
            }
          })
      )
    );
  } catch (err) {
    console.error("Webhook dispatch error:", err.message);
  }
};

module.exports = {
  dispatch,
};
