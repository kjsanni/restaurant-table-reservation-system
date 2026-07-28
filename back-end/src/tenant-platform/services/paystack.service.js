const axios = require("axios");
const db = require("../../db/models");

const PAYSTACK_BASE = process.env.PAYSTACK_MODE === "live"
  ? "https://api.paystack.co"
  : "https://api.paystack.co";

const envSecretKey = process.env.PAYSTACK_SECRET_KEY;
const envWebhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
const envMode = process.env.PAYSTACK_MODE || "test";

let cachedConfig = null;
let configLoadedAt = 0;

const loadPaystackConfig = async () => {
  const now = Date.now();
  if (cachedConfig && now - configLoadedAt < 60000) return cachedConfig;

  let secretKey = envSecretKey;
  let webhookSecret = envWebhookSecret;
  let mode = envMode;

  try {
    const setting = await db.setting.findOne({ where: { key: "paystack_config" } });
    if (setting && setting.value) {
      const cfg =
        typeof setting.value === "string"
          ? JSON.parse(setting.value)
          : setting.value;
      if (cfg.secretKey) secretKey = cfg.secretKey;
      if (cfg.webhookSecret) webhookSecret = cfg.webhookSecret;
      if (cfg.mode) mode = cfg.mode;
    }
  } catch {
    // fall back to env values
  }

  cachedConfig = { secretKey, webhookSecret, mode };
  configLoadedAt = now;
  return cachedConfig;
};

const buildClient = (secretKey) =>
  axios.create({
    baseURL: PAYSTACK_BASE,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

const buildPlatformClient = async () => {
  const config = await loadPaystackConfig();
  return buildClient(config.secretKey);
};

const validateSecretKey = async (secretKey) => {
  const client = buildClient(secretKey);
  try {
    await client.get("/transaction/verify/fake-reference-for-validation");
    return true;
  } catch (err) {
    if (err.response?.status === 404) return true;
    if (err.response?.status === 401) return false;
    return false;
  }
};

const updatePlatformPaystackConfig = async ({ secretKey, webhookSecret, mode }) => {
  const existing = await loadPaystackConfig();
  const payload = {
    secretKey: secretKey || existing.secretKey,
    webhookSecret: webhookSecret || existing.webhookSecret,
    mode: mode || existing.mode,
  };

  await db.setting.upsert({
    key: "paystack_config",
    value: payload,
    updatedAt: new Date(),
  });

  cachedConfig = null;
  configLoadedAt = 0;
  return payload;
};

const verifyWebhookSignature = async (payload, signature) => {
  const config = await loadPaystackConfig();
  if (!config.webhookSecret) return false;
  const crypto = require("crypto");
  const hash = crypto.createHmac("sha512", config.webhookSecret).update(payload).digest("hex");
  return hash === signature;
};

const createCustomer = async ({ email, firstName, lastName, phone }) => {
  const client = await buildPlatformClient();
  const response = await client.post("/customer", {
    email,
    first_name: firstName,
    last_name: lastName,
    phone,
  });
  return response.data.data;
};

const createSubscription = async ({ customerCode, planCode, authorization }) => {
  const client = await buildPlatformClient();
  const response = await client.post("/subscription", {
    customer: customerCode,
    plan: planCode,
    authorization,
  });
  return response.data.data;
};

const createPlan = async ({ name, amount, interval = "monthly", currency = "GHS" }) => {
  const client = await buildPlatformClient();
  const response = await client.post("/plan", {
    name,
    amount: amount * 100,
    interval,
    currency,
  });
  return response.data.data;
};

const initializeCharge = async ({ email, amount, metadata = {}, splitConfig = null, channels = null }) => {
  const client = await buildPlatformClient();
  const payload = {
    email,
    amount: amount * 100,
    metadata,
  };

  if (splitConfig) {
    payload.subaccount = splitConfig.subaccountCode;
    payload.transaction_charge = splitConfig.transactionCharge || 0;
    payload.bearer = splitConfig.bearer || "subaccount";
  }

  if (channels && Array.isArray(channels) && channels.length) {
    payload.channels = channels;
  }

  const response = await client.post("/transaction/initialize", payload);
  return response.data.data;
};

const verifyPayment = async (reference) => {
  const client = await buildPlatformClient();
  const response = await client.get(`/transaction/verify/${reference}`);
  return response.data.data;
};

const fetchCustomer = async (customerCode) => {
  const client = await buildPlatformClient();
  const response = await client.get(`/customer/${customerCode}`);
  return response.data.data;
};

const buildSplitConfig = (tenant) => {
  if (!tenant || !tenant.paystackSubaccountCode) return null;

  const settings = tenant.settings || {};
  const subaccount = tenant.paystackSubaccountCode;
  const bearer = settings.splitBearer || "subaccount";
  const charge = settings.splitCharge || 0;

  return {
    subaccountCode: subaccount,
    bearer,
    transactionCharge: charge,
  };
};

module.exports = {
  verifyWebhookSignature,
  createCustomer,
  createSubscription,
  createPlan,
  initializeCharge,
  verifyPayment,
  fetchCustomer,
  buildSplitConfig,
  buildPlatformClient,
  validateSecretKey,
  updatePlatformPaystackConfig,
};
