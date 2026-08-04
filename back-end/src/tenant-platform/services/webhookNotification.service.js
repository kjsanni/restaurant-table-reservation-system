const axios = require("axios");
const crypto = require("crypto");
const { URL } = require("url");
const dns = require("dns");
const webhookEndpointDAO = require("../DAOs/webhookEndpoint.dao");

const ALLOWED_PROTOCOLS = new Set(["https:"]);
const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
]);

const isPrivateIp = (ip) => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  return false;
};

const validateWebhookUrl = async (url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid webhook URL");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("Webhook URL must use https");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error("Webhook URL points to a blocked host");
  }

  if (hostname.includes(":")) {
    throw new Error("Webhook URL must not use an IPv6 literal address");
  }

  return new Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err) return reject(new Error("Unable to resolve webhook hostname"));
      if (addresses.some((ip) => isPrivateIp(ip))) {
        return reject(new Error("Webhook URL resolves to a private IP address"));
      }
      resolve();
    });
  });
};

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
          await validateWebhookUrl(ep.url);

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
  validateWebhookUrl,
};
