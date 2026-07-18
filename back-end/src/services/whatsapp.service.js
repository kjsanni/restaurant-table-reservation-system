const axios = require("axios");
const db = require("../db/models");

const envToken = process.env.WHATSAPP_TOKEN;
const envPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

const resolveConfig = async (tenantId) => {
  let token = envToken;
  let phoneNumberId = envPhoneNumberId;
  try {
    const where = tenantId ? { key: "whatsapp_config", tenantId } : { key: "whatsapp_config" };
    const setting = await db.setting.findOne({ where });
    if (setting && setting.value) {
      const cfg =
        typeof setting.value === "string"
          ? JSON.parse(setting.value)
          : setting.value;
      if (cfg.token) token = cfg.token;
      if (cfg.phoneNumberId) phoneNumberId = cfg.phoneNumberId;
    }
  } catch (err) {
    // fall back to env values on any read error
  }
  return { token, phoneNumberId, enabled: Boolean(token && phoneNumberId) };
};

const buildClient = (token, phoneNumberId) => {
  const baseUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}`;
  return {
    post: (path, payload) =>
      axios.post(`${baseUrl}${path}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
  };
};

const sendWhatsAppMessage = async (to, templateName, languageCode = "en_US", components = [], tenantId) => {
  const { token, phoneNumberId, enabled } = await resolveConfig(tenantId);
  if (!enabled) {
    throw new Error("WhatsApp is not configured.");
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formatPhoneNumber(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  try {
    const response = await buildClient(token, phoneNumberId).post("/messages", payload);
    return response.data;
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    throw new Error(`WhatsApp send failed: ${message}`);
  }
};

const sendWhatsAppText = async (to, text, tenantId) => {
  const { token, phoneNumberId, enabled } = await resolveConfig(tenantId);
  if (!enabled) {
    throw new Error("WhatsApp is not configured.");
  }

  const payload = {
    messaging_product: "whatsapp",
    to: formatPhoneNumber(to),
    type: "text",
    text: { body: text },
  };

  try {
    const response = await buildClient(token, phoneNumberId).post("/messages", payload);
    return response.data;
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    throw new Error(`WhatsApp send failed: ${message}`);
  }
};

const formatPhoneNumber = (phone) => {
  if (!phone && phone !== "") return null;
  let cleaned = String(phone).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith("233") && cleaned.length === 9) {
    cleaned = "233" + cleaned;
  }
  return cleaned || null;
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppText,
  formatPhoneNumber,
};
