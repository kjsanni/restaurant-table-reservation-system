const axios = require("axios");
const { normalizeSettingValue } = require("../utils/settings");

const AFRICASTALKING_BASE = "https://api.africastalking.com/restless/send";

const africaTalkingSender = async ({ to, message, senderId, config }) => {
  const username = config?.username || process.env.AFRICASTALKING_USERNAME;
  const apiKey = config?.apiKey || process.env.AFRICASTALKING_API_KEY;
  const from = senderId || config?.senderId || process.env.AFRICASTALKING_SENDER_ID || "RTRS";

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
  payload.append("from", from);

  const response = await axios.post(AFRICASTALKING_BASE, payload.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey,
    },
  });
  return response.data;
};

const twilioSender = async ({ to, message, senderId, config }) => {
  const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;
  const from = senderId || config?.senderId || process.env.TWILIO_PHONE_NUMBER || "";

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio is not configured.");
  }

  const cleanedTo = String(to).replace(/[^\d+]/g, "");
  if (!cleanedTo) {
    throw new Error("Recipient phone number is required.");
  }

  const response = await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    new URLSearchParams({
      To: cleanedTo,
      From: from,
      Body: message,
    }),
    {
      auth: {
        username: accountSid,
        password: authToken,
      },
    }
  );
  return response.data;
};

const PROVIDERS = {
  africastalking: africaTalkingSender,
  twilio: twilioSender,
};

const resolveProvider = (config = {}) => {
  const provider = config.provider || process.env.SMS_PROVIDER || "africastalking";
  const sender = PROVIDERS[provider];
  if (!sender) {
    throw new Error(`Unknown SMS provider: ${provider}`);
  }
  return sender;
};

const sendSMS = async ({ to, message, senderId }, tenantId = null) => {
  let config = {};
  if (tenantId) {
    try {
      const db = require("../db/models");
      const setting = await db.setting.findOne({
        where: { key: "africastalking_config", tenantId },
      });
      if (setting && setting.value) {
        config = normalizeSettingValue(setting.value);
      }
    } catch {
      // ignore and fall back to env values
    }
  }

  const sender = resolveProvider(config);
  return sender({ to, message, senderId, config });
};

const getProviderStatus = async (tenantId = null) => {
  let config = {};
  if (tenantId) {
    try {
      const db = require("../db/models");
      const setting = await db.setting.findOne({
        where: { key: "africastalking_config", tenantId },
      });
      if (setting && setting.value) {
        config = normalizeSettingValue(setting.value);
      }
    } catch {
      // ignore
    }
  }

  const provider = config.provider || process.env.SMS_PROVIDER || "africastalking";
  const hasUsername = !!(config.username || process.env.AFRICASTALKING_USERNAME);
  const hasApiKey = !!(config.apiKey || process.env.AFRICASTALKING_API_KEY);
  const hasAccountSid = !!(config.accountSid || process.env.TWILIO_ACCOUNT_SID);
  const hasAuthToken = !!(config.authToken || process.env.TWILIO_AUTH_TOKEN);
  const hasSenderId = !!(config.senderId || process.env.TWILIO_PHONE_NUMBER || process.env.AFRICASTALKING_SENDER_ID);

  let configured = false;
  if (provider === "africastalking") {
    configured = hasUsername && hasApiKey;
  } else if (provider === "twilio") {
    configured = hasAccountSid && hasAuthToken && hasSenderId;
  }

  const prefix = provider === "africastalking" ? "AFRICASTALKING" : "TWILIO";
  const fields =
    provider === "africastalking"
      ? ["username", "apiKey"]
      : ["accountSid", "authToken", "senderId"];

  return {
    provider,
    configured,
    hasSenderId,
    missingFields: configured
      ? []
      : fields.filter((f) => !(config[f] || process.env[prefix + "_" + f.toUpperCase()])),
  };
};

module.exports = {
  sendSMS,
  getProviderStatus,
  PROVIDERS,
  resolveProvider,
};
