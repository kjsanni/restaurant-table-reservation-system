const axios = require("axios");
const crypto = require("crypto");
const webhookEndpointDAO = require("../DAOs/webhookEndpoint.dao");

const computeSignature = (secret, payload) => {
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
};

const fireWebhook = async (event, payload, tenantId = null) => {
  try {
    const endpoints = await webhookEndpointDAO.findAll({
      tenantId,
      isActive: true,
    });

    const matches = endpoints.filter((ep) => {
      const events = Array.isArray(ep.events) ? ep.events : [];
      return events.includes("*") || events.includes(event);
    });

    if (matches.length === 0) return;

    await Promise.allSettled(
      matches.map(async (ep) => {
        try {
          const signature = computeSignature(ep.secret, payload);
          await axios.post(ep.url, payload, {
            headers: {
              "Content-Type": "application/json",
              "X-Vibespot-Event": event,
              ...(signature ? { "X-Vibespot-Signature": signature } : {}),
            },
            timeout: 5000,
          });

          await webhookEndpointDAO.update(ep.id, {
            lastError: null,
            lastTriggeredAt: new Date(),
          });
        } catch (err) {
          await webhookEndpointDAO.update(ep.id, {
            lastError: err.message,
          }).catch(() => {});
        }
      })
    );
  } catch {
    // ignore webhook fan-out failures
  }
};

module.exports = {
  fireWebhook,
};
