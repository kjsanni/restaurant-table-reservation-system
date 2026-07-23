const axios = require("axios");

const AFRICASTALKING_BASE = "https://api.africastalking.com/restless/send";

const sendSMS = async ({ to, message, senderId = "RTRS" }, tenantId = null) => {
  let username = process.env.AFRICASTALKING_USERNAME;
  let apiKey = process.env.AFRICASTALKING_API_KEY;

  try {
    if (tenantId) {
      const db = require("../db/models");
      const setting = await db.setting.findOne({
        where: { key: "africastalking_config", tenantId },
      });
      if (setting && setting.value) {
        const cfg = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
        if (cfg.username) username = cfg.username;
        if (cfg.apiKey) apiKey = cfg.apiKey;
        if (cfg.senderId) senderId = cfg.senderId;
      }
    }
  } catch {
    // ignore and fall back to env values
  }

  if (!username || !apiKey) {
    throw new Error("Africa's Talking is not configured.");
  }

  const cleanedTo = String(to).replace(/[^\d+]/g, "");
  if (!cleanedTo) {
    throw new Error("Recipient phone number is required.");
  }

  const payload = new URLSearchParams();
  payload.append("username", username);
  payload.append("to", cleanedTo);
  payload.append("message", message);
  payload.append("from", senderId);

  try {
    const response = await axios.post(AFRICASTALKING_BASE, payload.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": apiKey,
      },
    });
    return response.data;
  } catch (err) {
    const errorMessage = err.response?.data?.ErrorMessage || err.message;
    throw new Error(`SMS send failed: ${errorMessage}`);
  }
};

module.exports = {
  sendSMS,
};
